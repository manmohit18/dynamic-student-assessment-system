import { cookies } from "next/headers";

import { decodeSession } from "@/lib/auth";
import { recalculateCourseFinalGrades } from "@/lib/db-queries";
import { executeMany, query } from "@/lib/oracle";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get("course_portal_session")?.value);
  if (!session || session.role !== "faculty") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    assessmentId?: number;
    marks?: Array<{ studentEmail?: string; marksObtained?: number }>;
  };

  if (!body.assessmentId || !Array.isArray(body.marks) || body.marks.length === 0) {
    return Response.json({ error: "Missing assessment or marks." }, { status: 400 });
  }

  const assessmentRows = await query<Record<string, unknown>>(
    `
      SELECT a.assessment_id, fo.faculty_id, fo.course_offering_id
      FROM assessment a
      JOIN course_offering fo ON fo.course_offering_id = a.course_offering_id
      WHERE a.assessment_id = :assessmentId
        AND fo.faculty_id = (
          SELECT faculty_id FROM faculty WHERE email = :email FETCH FIRST 1 ROW ONLY
        )
      FETCH FIRST 1 ROW ONLY
    `,
    { assessmentId: body.assessmentId, email: session.email },
  );

  if (!assessmentRows[0]) {
    return Response.json({ error: "Assessment not found." }, { status: 404 });
  }

  const binds = body.marks
    .filter((row) => row.studentEmail && typeof row.marksObtained === "number")
    .map((row) => ({
      student_mail: String(row.studentEmail).toLowerCase(),
      assessment_id: Number(body.assessmentId),
      attempt_date: new Date().toISOString().slice(0, 10),
      marks_obtained: Number(row.marksObtained),
    }));

  await executeMany(
    `
      MERGE INTO attempts t
      USING (
        SELECT :student_mail AS student_mail,
               :assessment_id AS assessment_id,
               TO_DATE(:attempt_date, 'YYYY-MM-DD') AS attempt_date,
               :marks_obtained AS marks_obtained
        FROM dual
      ) src
      ON (t.student_mail = src.student_mail AND t.assessment_id = src.assessment_id)
      WHEN MATCHED THEN
        UPDATE SET t.attempt_date = src.attempt_date, t.marks_obtained = src.marks_obtained
      WHEN NOT MATCHED THEN
        INSERT (student_mail, assessment_id, attempt_date, marks_obtained)
        VALUES (src.student_mail, src.assessment_id, src.attempt_date, src.marks_obtained)
    `,
    binds,
  );

  await recalculateCourseFinalGrades(Number(assessmentRows[0].COURSE_OFFERING_ID));

  return Response.json({ ok: true });
}

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
    totalMarks?: number;
    weight?: number;
    marks?: Array<{ studentEmail?: string; marksObtained?: number }>;
  };

  if (!body.assessmentId || !Array.isArray(body.marks) || body.marks.length === 0 || typeof body.totalMarks !== "number" || typeof body.weight !== "number") {
    return Response.json({ error: "Missing assessment, marks, total marks, or weight." }, { status: 400 });
  }

  const totalMarks = Number(body.totalMarks);
  const weight = Number(body.weight);
  if (!Number.isFinite(totalMarks) || totalMarks <= 0 || !Number.isFinite(weight) || weight <= 0) {
    return Response.json({ error: "Total marks and weight must be positive numbers." }, { status: 400 });
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

  const maxMarkRows = await query<Record<string, unknown>>(
    `
      SELECT NVL(MAX(marks_obtained), 0) AS max_obtained
      FROM attempts
      WHERE assessment_id = :assessmentId
    `,
    { assessmentId: body.assessmentId },
  );

  const maxObtained = Number(maxMarkRows[0]?.MAX_OBTAINED ?? 0);
  if (maxObtained > totalMarks) {
    return Response.json(
      { error: `Total marks cannot be less than existing uploaded marks (${maxObtained}).` },
      { status: 400 },
    );
  }

  try {
    await executeMany(
      `
        UPDATE assessment
        SET total_marks = :totalMarks,
            weight = :weight
        WHERE assessment_id = :assessmentId
      `,
      [{ totalMarks, weight, assessmentId: Number(body.assessmentId) }],
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update assessment settings.";
    return Response.json({ error: message }, { status: 400 });
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

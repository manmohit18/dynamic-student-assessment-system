import { cookies } from "next/headers";

import { decodeSession } from "@/lib/auth";
import { recalculateCourseFinalGrades } from "@/lib/db-queries";
import { executeMany, query, execute } from "@/lib/oracle";

type CutoffInput = {
  grade?: string;
  minMarks?: number;
};

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get("course_portal_session")?.value);
  if (!session || session.role !== "faculty") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    courseOfferingId?: number;
    cutoffs?: CutoffInput[];
  };

  const courseOfferingId = Number(body.courseOfferingId);
  if (!courseOfferingId || !Array.isArray(body.cutoffs) || body.cutoffs.length === 0) {
    return Response.json({ error: "Missing course offering or cutoffs." }, { status: 400 });
  }

  const offeringRows = await query<Record<string, unknown>>(
    `
      SELECT fo.course_offering_id
      FROM course_offering fo
      WHERE fo.course_offering_id = :courseOfferingId
        AND fo.faculty_id = (
          SELECT faculty_id FROM faculty WHERE email = :email FETCH FIRST 1 ROW ONLY
        )
      FETCH FIRST 1 ROW ONLY
    `,
    { courseOfferingId, email: session.email },
  );

  if (!offeringRows[0]) {
    return Response.json({ error: "Course offering not found." }, { status: 404 });
  }

  const normalized = body.cutoffs
    .filter((row) => row.grade && typeof row.minMarks === "number" && Number.isFinite(row.minMarks))
    .map((row) => ({
      grade: String(row.grade).toUpperCase(),
      minMarks: Math.max(0, Math.min(100, Number(row.minMarks))),
    }))
    .sort((left, right) => right.minMarks - left.minMarks);

  if (!normalized.length) {
    return Response.json({ error: "No valid cutoff rows were provided." }, { status: 400 });
  }

  const deduped = Array.from(new Map(normalized.map((row) => [row.grade, row])).values()).sort(
    (left, right) => right.minMarks - left.minMarks,
  );

  const cutoffRows = deduped.map((row, index) => {
    const higher = deduped[index - 1];
    const maxMarks = higher ? Math.max(row.minMarks, Number((higher.minMarks - 0.01).toFixed(2))) : 100;
    return {
      course_offering_id: courseOfferingId,
      grade: row.grade,
      min_marks: row.minMarks,
      max_marks: maxMarks,
    };
  });

  await execute(
    `DELETE FROM grade_cutoffs WHERE course_offering_id = :courseOfferingId`,
    { courseOfferingId },
  );

  await executeMany(
    `
      INSERT INTO grade_cutoffs (grade, min_marks, max_marks, course_offering_id)
      VALUES (:grade, :min_marks, :max_marks, :course_offering_id)
    `,
    cutoffRows,
  );

  await recalculateCourseFinalGrades(courseOfferingId);

  return Response.json({ ok: true, updated: cutoffRows.length });
}

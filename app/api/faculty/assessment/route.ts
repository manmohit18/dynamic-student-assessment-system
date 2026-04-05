import { cookies } from "next/headers";

import { decodeSession } from "@/lib/auth";
import { recalculateCourseFinalGrades } from "@/lib/db-queries";
import { execute, query } from "@/lib/oracle";

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
  };

  if (!body.assessmentId || typeof body.totalMarks !== "number" || typeof body.weight !== "number") {
    return Response.json({ error: "Missing assessment, total marks, or weight." }, { status: 400 });
  }

  const assessmentId = Number(body.assessmentId);
  const totalMarks = Number(body.totalMarks);
  const weight = Number(body.weight);

  if (!Number.isFinite(totalMarks) || totalMarks <= 0 || !Number.isFinite(weight) || weight <= 0) {
    return Response.json({ error: "Total marks and weight must be positive numbers." }, { status: 400 });
  }

  const rows = await query<Record<string, unknown>>(
    `
      SELECT a.assessment_id, a.assessment_type, fo.course_offering_id
      FROM assessment a
      JOIN course_offering fo ON fo.course_offering_id = a.course_offering_id
      WHERE a.assessment_id = :assessmentId
        AND fo.faculty_id = (
          SELECT faculty_id FROM faculty WHERE email = :email FETCH FIRST 1 ROW ONLY
        )
      FETCH FIRST 1 ROW ONLY
    `,
    { assessmentId, email: session.email },
  );

  const assessment = rows[0];
  if (!assessment) {
    return Response.json({ error: "Assessment not found." }, { status: 404 });
  }

  if (!/quiz/i.test(String(assessment.ASSESSMENT_TYPE ?? ""))) {
    return Response.json({ error: "Only quiz components can be reconfigured here." }, { status: 400 });
  }

  const maxMarkRows = await query<Record<string, unknown>>(
    `
      SELECT NVL(MAX(marks_obtained), 0) AS max_obtained
      FROM attempts
      WHERE assessment_id = :assessmentId
    `,
    { assessmentId },
  );

  const maxObtained = Number(maxMarkRows[0]?.MAX_OBTAINED ?? 0);
  if (maxObtained > totalMarks) {
    return Response.json(
      { error: `Total marks cannot be less than existing uploaded marks (${maxObtained}).` },
      { status: 400 },
    );
  }

  try {
    await execute(
      `
        UPDATE assessment
        SET total_marks = :totalMarks,
            weight = :weight
        WHERE assessment_id = :assessmentId
      `,
      { totalMarks, weight, assessmentId },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update quiz settings.";
    return Response.json({ error: message }, { status: 400 });
  }

  await recalculateCourseFinalGrades(Number(assessment.COURSE_OFFERING_ID));

  return Response.json({ ok: true });
}

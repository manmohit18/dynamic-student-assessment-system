import { cookies } from "next/headers";

import { decodeSession } from "@/lib/auth";
import { getCourseCutoffs, getCourseReport, getFacultyCourseStudents } from "@/lib/db-queries";
import { query } from "@/lib/oracle";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ courseOfferingId: string }> },
) {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get("course_portal_session")?.value);
  if (!session || session.role !== "faculty") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseOfferingId } = await ctx.params;
  const offeringRows = await query<Record<string, unknown>>(
    `
      SELECT
        fo.course_offering_id,
        fo.academic_year,
        fo.semester,
        fo.branch,
        fo.course_id,
        c.title AS course_title,
        c.course_type,
        c.credits,
        f.name AS faculty_name
      FROM course_offering fo
      JOIN course c ON c.course_id = fo.course_id
      JOIN faculty f ON f.faculty_id = fo.faculty_id
      WHERE fo.course_offering_id = :courseOfferingId
        AND fo.faculty_id = (
          SELECT faculty_id FROM faculty WHERE email = :email FETCH FIRST 1 ROW ONLY
        )
      FETCH FIRST 1 ROW ONLY
    `,
    { courseOfferingId: Number(courseOfferingId), email: session.email },
  );

  const offering = offeringRows[0];
  if (!offering) {
    return Response.json({ error: "Offering not found." }, { status: 404 });
  }

  const students = await getFacultyCourseStudents(Number(courseOfferingId));
  const report = await getCourseReport(Number(courseOfferingId));
  const cutoffs = await getCourseCutoffs(Number(courseOfferingId));
  const assessments = await query<Record<string, unknown>>(
    `
      SELECT assessment_id, assessment_type, total_marks, weight, TO_CHAR(assessment_date, 'YYYY-MM-DD') AS assessment_date
      FROM assessment
      WHERE course_offering_id = :courseOfferingId
      ORDER BY assessment_date, assessment_id
    `,
    { courseOfferingId: Number(courseOfferingId) },
  );

  return Response.json({
    offering: {
      courseOfferingId: Number(offering.COURSE_OFFERING_ID),
      academicYear: Number(offering.ACADEMIC_YEAR),
      semester: Number(offering.SEMESTER),
      branch: String(offering.BRANCH),
      courseId: String(offering.COURSE_ID),
      courseTitle: String(offering.COURSE_TITLE),
      courseType: String(offering.COURSE_TYPE),
      credits: Number(offering.CREDITS),
      facultyName: String(offering.FACULTY_NAME),
    },
    students,
    report,
    cutoffs,
    assessments: assessments.map((assessment: Record<string, unknown>) => ({
      assessmentId: Number(assessment.ASSESSMENT_ID),
      assessmentType: String(assessment.ASSESSMENT_TYPE),
      totalMarks: Number(assessment.TOTAL_MARKS),
      weight: Number(assessment.WEIGHT),
      assessmentDate: String(assessment.ASSESSMENT_DATE),
    })),
  });
}

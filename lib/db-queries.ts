import oracledb from "oracledb";

import { query, execute } from "@/lib/oracle";

export type StudentProfile = {
  email: string;
  username: string;
  branch: string;
  currentSemester: number;
  currentYear: number;
  cgpa: number;
  lastSgpa: number;
};

export type StudentSgpaRecord = {
  semester: number;
  academicYear: number;
  gpa: number;
};

export type CourseProgress = {
  courseOfferingId: number;
  academicYear: number;
  semester: number;
  branch: string;
  courseId: string;
  courseTitle: string;
  courseType: string;
  credits: number;
  earnedRaw: number;
  possibleRaw: number;
  weightedTotal: number;
  finalGrade: string | null;
  status: string;
  facultyName: string;
};

export type CourseDetailAssessment = {
  assessmentId: number;
  assessmentType: string;
  totalMarks: number;
  weight: number;
  assessmentDate: string | null;
  marksObtained: number | null;
};

export type FacultyOffering = {
  courseOfferingId: number;
  academicYear: number;
  semester: number;
  branch: string;
  courseId: string;
  courseTitle: string;
  courseType: string;
  credits: number;
  totalStudents: number;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
};

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return fallback;
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" ? value : null;
}

export async function getStudentProfile(email: string): Promise<StudentProfile | null> {
  const rows = (await query<Record<string, unknown>>(
    `
      SELECT *
      FROM v_student_profile
      WHERE email = :email
    `,
    { email },
  )) as Record<string, unknown>[];

  const row = rows[0];
  if (!row) return null;

  return {
    email: String(row.EMAIL),
    username: String(row.USERNAME),
    branch: String(row.BRANCH),
    currentSemester: toNumber(row.CURRENT_SEMESTER),
    currentYear: toNumber(row.CURRENT_YEAR),
    cgpa: toNumber(row.CGPA),
    lastSgpa: toNumber(row.LAST_SGPA),
  };
}

export async function getStudentCourses(email: string): Promise<CourseProgress[]> {
  const rows = (await query<Record<string, unknown>>(
    `
      SELECT
        p.course_offering_id,
        p.academic_year,
        p.semester,
        p.branch,
        p.course_id,
        p.course_title,
        p.course_type,
        p.credits,
        p.earned_raw,
        p.possible_raw,
        p.weighted_total,
        p.final_grade,
        p.status,
        p.faculty_name
      FROM v_student_course_progress p
      WHERE p.student_mail = :email
      ORDER BY p.academic_year DESC, p.semester DESC, p.course_title
    `,
    { email },
  )) as Record<string, unknown>[];

  return rows.map((row) => ({
    courseOfferingId: toNumber(row.COURSE_OFFERING_ID),
    academicYear: toNumber(row.ACADEMIC_YEAR),
    semester: toNumber(row.SEMESTER),
    branch: String(row.BRANCH),
    courseId: String(row.COURSE_ID),
    courseTitle: String(row.COURSE_TITLE),
    courseType: String(row.COURSE_TYPE),
    credits: toNumber(row.CREDITS),
    earnedRaw: toNumber(row.EARNED_RAW),
    possibleRaw: toNumber(row.POSSIBLE_RAW),
    weightedTotal: toNumber(row.WEIGHTED_TOTAL),
    finalGrade: toStringOrNull(row.FINAL_GRADE),
    status: String(row.STATUS),
    facultyName: String(row.FACULTY_NAME),
  }));
}

export async function getStudentSgpaHistory(email: string): Promise<StudentSgpaRecord[]> {
  const rows = (await query<Record<string, unknown>>(
    `
      SELECT semester, academic_year, gpa
      FROM sgpa
      WHERE student_id = :email
      ORDER BY academic_year DESC, semester DESC
    `,
    { email },
  )) as Record<string, unknown>[];

  return rows.map((row) => ({
    semester: toNumber(row.SEMESTER),
    academicYear: toNumber(row.ACADEMIC_YEAR),
    gpa: toNumber(row.GPA),
  }));
}

export async function getCourseDetail(email: string, courseOfferingId: number) {
  const courseRows = (await query<Record<string, unknown>>(
    `
      SELECT
        p.course_offering_id,
        p.academic_year,
        p.semester,
        p.branch,
        p.course_id,
        p.course_title,
        p.course_type,
        p.credits,
        p.earned_raw,
        p.possible_raw,
        p.weighted_total,
        p.final_grade,
        p.status,
        p.faculty_name
      FROM v_student_course_progress p
      WHERE p.student_mail = :email
        AND p.course_offering_id = :courseOfferingId
    `,
    { email, courseOfferingId },
  )) as Record<string, unknown>[];

  const assessments = (await query<Record<string, unknown>>(
    `
      SELECT
        a.assessment_id,
        a.assessment_type,
        a.total_marks,
        a.weight,
        TO_CHAR(a.assessment_date, 'YYYY-MM-DD') AS assessment_date,
        at.marks_obtained
      FROM assessment a
      LEFT JOIN attempts at
        ON at.assessment_id = a.assessment_id
       AND at.student_mail = :email
      WHERE a.course_offering_id = :courseOfferingId
      ORDER BY a.assessment_date, a.assessment_id
    `,
    { email, courseOfferingId },
  )) as Record<string, unknown>[];

  const row = courseRows[0];
  if (!row) return null;

  return {
    course: {
      courseOfferingId: toNumber(row.COURSE_OFFERING_ID),
      academicYear: toNumber(row.ACADEMIC_YEAR),
      semester: toNumber(row.SEMESTER),
      branch: String(row.BRANCH),
      courseId: String(row.COURSE_ID),
      courseTitle: String(row.COURSE_TITLE),
      courseType: String(row.COURSE_TYPE),
      credits: toNumber(row.CREDITS),
      earnedRaw: toNumber(row.EARNED_RAW),
      possibleRaw: toNumber(row.POSSIBLE_RAW),
      weightedTotal: toNumber(row.WEIGHTED_TOTAL),
      finalGrade: toStringOrNull(row.FINAL_GRADE),
      status: String(row.STATUS),
      facultyName: String(row.FACULTY_NAME),
    },
    assessments: assessments.map((assessment: Record<string, unknown>) => ({
      assessmentId: toNumber(assessment.ASSESSMENT_ID),
      assessmentType: String(assessment.ASSESSMENT_TYPE),
      totalMarks: toNumber(assessment.TOTAL_MARKS),
      weight: toNumber(assessment.WEIGHT),
      assessmentDate: toStringOrNull(assessment.ASSESSMENT_DATE),
      marksObtained: assessment.MARKS_OBTAINED === null ? null : toNumber(assessment.MARKS_OBTAINED),
    })),
  };
}

export async function getFacultyOfferings(email: string): Promise<FacultyOffering[]> {
  const rows = (await query<Record<string, unknown>>(
    `
      SELECT
        fo.course_offering_id,
        fo.academic_year,
        fo.semester,
        fo.branch,
        c.course_id,
        c.title AS course_title,
        c.course_type,
        c.credits,
        NVL(COUNT(DISTINCT at.student_mail), 0) AS total_students,
        NVL(ROUND(AVG(at.marks_obtained), 2), 0) AS average_marks,
        NVL(MAX(at.marks_obtained), 0) AS highest_marks,
        NVL(MIN(at.marks_obtained), 0) AS lowest_marks
      FROM course_offering fo
      JOIN course c ON c.course_id = fo.course_id
      LEFT JOIN assessment a ON a.course_offering_id = fo.course_offering_id
      LEFT JOIN attempts at ON at.assessment_id = a.assessment_id
      WHERE fo.faculty_id = (
        SELECT faculty_id FROM faculty WHERE email = :email FETCH FIRST 1 ROW ONLY
      )
      GROUP BY
        fo.course_offering_id,
        fo.academic_year,
        fo.semester,
        fo.branch,
        c.course_id,
        c.title,
        c.course_type,
        c.credits
      ORDER BY fo.academic_year DESC, fo.semester DESC, fo.course_offering_id
    `,
    { email },
  )) as Record<string, unknown>[];

  return rows.map((row) => ({
    courseOfferingId: toNumber(row.COURSE_OFFERING_ID),
    academicYear: toNumber(row.ACADEMIC_YEAR),
    semester: toNumber(row.SEMESTER),
    branch: String(row.BRANCH),
    courseId: String(row.COURSE_ID),
    courseTitle: String(row.COURSE_TITLE),
    courseType: String(row.COURSE_TYPE),
    credits: toNumber(row.CREDITS),
    totalStudents: toNumber(row.TOTAL_STUDENTS),
    averageMarks: toNumber(row.AVERAGE_MARKS),
    highestMarks: toNumber(row.HIGHEST_MARKS),
    lowestMarks: toNumber(row.LOWEST_MARKS),
  }));
}

export async function getFacultyCourseStudents(courseOfferingId: number) {
  const rows = (await query<Record<string, unknown>>(
    `
      SELECT
        s.email,
        s.username,
        s.branch,
        a.status,
        NVL((
          SELECT ROUND(SUM((at.marks_obtained / NULLIF(asmt.total_marks, 0)) * asmt.weight), 2)
          FROM attempts at
          JOIN assessment asmt ON asmt.assessment_id = at.assessment_id
          WHERE at.student_mail = s.email
            AND asmt.course_offering_id = :courseOfferingId
        ), 0) AS weighted_total,
        NVL((
          SELECT ROUND(SUM(at.marks_obtained), 2)
          FROM attempts at
          JOIN assessment asmt ON asmt.assessment_id = at.assessment_id
          WHERE at.student_mail = s.email
            AND asmt.course_offering_id = :courseOfferingId
        ), 0) AS raw_total,
        NVL((
          SELECT ROUND(SUM(asmt.total_marks), 2)
          FROM attempts at
          JOIN assessment asmt ON asmt.assessment_id = at.assessment_id
          WHERE at.student_mail = s.email
            AND asmt.course_offering_id = :courseOfferingId
        ), 0) AS raw_possible,
        GetGrade(
          NVL((
            SELECT ROUND(SUM((at.marks_obtained / NULLIF(asmt.total_marks, 0)) * asmt.weight), 2)
            FROM attempts at
            JOIN assessment asmt ON asmt.assessment_id = at.assessment_id
            WHERE at.student_mail = s.email
              AND asmt.course_offering_id = :courseOfferingId
          ), 0),
          :courseOfferingId
        ) AS final_grade
      FROM attends a
      JOIN student s ON s.email = a.student_mail
      WHERE a.course_offering_id = :courseOfferingId
      GROUP BY s.email, s.username, s.branch, a.status
      ORDER BY s.username
    `,
    { courseOfferingId },
  )) as Record<string, unknown>[];

  return rows.map((row) => ({
    email: String(row.EMAIL),
    username: String(row.USERNAME),
    branch: String(row.BRANCH),
    status: String(row.STATUS),
    weightedTotal: toNumber(row.WEIGHTED_TOTAL),
    rawTotal: toNumber(row.RAW_TOTAL),
    rawPossible: toNumber(row.RAW_POSSIBLE),
    finalGrade: toStringOrNull(row.FINAL_GRADE),
  }));
}

export async function getCourseReport(courseOfferingId: number) {
  const result = await execute(
    `
      BEGIN
        ClassReport(:courseOfferingId, :averageMarks, :highestMarks, :lowestMarks);
      END;
    `,
    {
      courseOfferingId,
      averageMarks: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      highestMarks: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      lowestMarks: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    },
  );

  return {
    average: Number(result.outBinds?.averageMarks ?? 0),
    highest: Number(result.outBinds?.highestMarks ?? 0),
    lowest: Number(result.outBinds?.lowestMarks ?? 0),
  };
}

export async function getGradeForScore(score: number, courseOfferingId: number) {
  const rows = (await query<Record<string, unknown>>(
    `SELECT GetGrade(:score, :courseOfferingId) AS grade FROM dual`,
    { score, courseOfferingId },
  )) as Record<string, unknown>[];

  return String(rows[0]?.GRADE ?? "F");
}

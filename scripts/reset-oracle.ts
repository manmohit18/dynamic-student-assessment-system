/// <reference types="node" />

import { branches, semesterCourses } from "../lib/catalog";
import { hashPassword } from "../lib/auth";
import { execute, executeMany, query } from "../lib/oracle";
import type {
  AssessmentResult,
  CourseOfferingResult,
  RoleSeed,
  StudentSeed,
} from "../types/reset-oracle";

const sampleFaculty: RoleSeed[] = [
  {
    email: "faculty.cse@college.edu",
    username: "Dr. Ananya Rao",
    password: "Faculty@123",
    role: "faculty",
    department: "CSE",
  },
  {
    email: "faculty.core@college.edu",
    username: "Dr. Vikram Sen",
    password: "Faculty@123",
    role: "faculty",
    department: "CSE",
  },
  {
    email: "faculty.it@college.edu",
    username: "Dr. Leena Iyer",
    password: "Faculty@123",
    role: "faculty",
    department: "IT",
  },
  {
    email: "faculty.cce@college.edu",
    username: "Dr. Karthik Das",
    password: "Faculty@123",
    role: "faculty",
    department: "CCE",
  },
  {
    email: "faculty.dse@college.edu",
    username: "Dr. Rohan Bhat",
    password: "Faculty@123",
    role: "faculty",
    department: "DSE",
  },
  {
    email: "faculty.aiml@college.edu",
    username: "Dr. Meera Kulkarni",
    password: "Faculty@123",
    role: "faculty",
    department: "AIML",
  },
  {
    email: "faculty.math@college.edu",
    username: "Dr. Neel Shah",
    password: "Faculty@123",
    role: "faculty",
    department: "MAT",
  },
  {
    email: "faculty.physics@college.edu",
    username: "Dr. Priya Menon",
    password: "Faculty@123",
    role: "faculty",
    department: "PHY",
  },
];

const sampleStudents: StudentSeed[] = branches.flatMap((branch, branchIndex) =>
  Array.from({ length: 6 }, (_, studentIndex) => {
    const id = branchIndex * 6 + studentIndex + 1;
    const isPrimaryCseStudent = branch === "CSE" && studentIndex === 0;
    return {
      email: isPrimaryCseStudent
        ? "cse.student@college.edu"
        : `${branch.toLowerCase()}.student${studentIndex + 1}@college.edu`,
      username: isPrimaryCseStudent ? "Aarav Mehta" : `${branch} Student ${studentIndex + 1}`,
      password: "Student@123",
      role: "student" as const,
      branch,
      currentSemester: 4,
      currentYear: 2025,
      graduationYear: 2027 + (id % 2),
    };
  }),
);

const gradePoints: Record<string, number> = {
  "A+": 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  E: 5,
  F: 0,
};

function getGradeFromScore(score: number) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  if (score >= 40) return "E";
  return "F";
}

function randFromSeed(seed: number, min: number, max: number) {
  const x = Math.sin(seed) * 10000;
  const frac = x - Math.floor(x);
  return Math.floor(frac * (max - min + 1)) + min;
}

function assessmentPlan(type: "Theory" | "Lab") {
  return type === "Theory"
    ? [
        { label: "Quiz", totalMarks: 10, weight: 10 },
        { label: "Mid Term", totalMarks: 30, weight: 30 },
        { label: "End Term", totalMarks: 50, weight: 50 },
      ]
    : [
        { label: "Notebook", totalMarks: 20, weight: 20 },
        { label: "Quiz", totalMarks: 10, weight: 10 },
        { label: "Mid Term", totalMarks: 30, weight: 30 },
        { label: "End Term", totalMarks: 40, weight: 40 },
      ];
}

async function dropEverything() {
  const objects = await query<{ OBJECT_NAME: string; OBJECT_TYPE: string }>(
    `
      SELECT object_name, object_type
      FROM user_objects
      WHERE object_type IN (
        'VIEW',
        'TRIGGER',
        'PROCEDURE',
        'FUNCTION',
        'TABLE',
        'SEQUENCE'
      )
      ORDER BY CASE object_type
        WHEN 'VIEW' THEN 1
        WHEN 'TRIGGER' THEN 2
        WHEN 'PROCEDURE' THEN 3
        WHEN 'FUNCTION' THEN 4
        WHEN 'TABLE' THEN 5
        WHEN 'SEQUENCE' THEN 6
        ELSE 99
      END
    `,
  );

  for (const object of objects) {
    const name = String(object.OBJECT_NAME);
    const type = String(object.OBJECT_TYPE);

    try {
      if (type === "VIEW") {
        await execute(`DROP VIEW ${name}`);
      } else if (type === "TRIGGER") {
        await execute(`DROP TRIGGER ${name}`);
      } else if (type === "PROCEDURE") {
        await execute(`DROP PROCEDURE ${name}`);
      } else if (type === "FUNCTION") {
        await execute(`DROP FUNCTION ${name}`);
      } else if (type === "SEQUENCE") {
        await execute(`DROP SEQUENCE ${name}`);
      } else if (type === "TABLE") {
        await execute(`DROP TABLE ${name} CASCADE CONSTRAINTS PURGE`);
      }
    } catch {
      // Ignore objects that are already gone or have dependency edges.
    }
  }
}

async function createSchema() {
  await execute(`
    CREATE TABLE student (
      email VARCHAR2(255) PRIMARY KEY,
      username VARCHAR2(120) NOT NULL,
      password_hash VARCHAR2(255) NOT NULL,
      branch VARCHAR2(20) NOT NULL,
      graduation_year NUMBER(4) NOT NULL,
      current_semester NUMBER(2) NOT NULL,
      current_year NUMBER(4) NOT NULL,
      role VARCHAR2(20) DEFAULT 'student' NOT NULL
    )
  `);

  await execute(`
    CREATE TABLE faculty (
      faculty_id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      name VARCHAR2(120) NOT NULL,
      email VARCHAR2(255) NOT NULL UNIQUE,
      password_hash VARCHAR2(255) NOT NULL,
      department VARCHAR2(20) NOT NULL
    )
  `);

  await execute(`
    CREATE TABLE course (
      course_id VARCHAR2(20) PRIMARY KEY,
      title VARCHAR2(255) NOT NULL,
      course_type VARCHAR2(20) NOT NULL,
      credits NUMBER(2) NOT NULL,
      department VARCHAR2(20) NOT NULL
    )
  `);

  await execute(`
    CREATE TABLE course_offering (
      course_offering_id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      academic_year NUMBER(4) NOT NULL,
      semester NUMBER(2) NOT NULL,
      status VARCHAR2(20) DEFAULT 'current' NOT NULL,
      branch VARCHAR2(20) NOT NULL,
      course_id VARCHAR2(20) NOT NULL,
      faculty_id NUMBER NOT NULL,
      CONSTRAINT fk_course_offering_course FOREIGN KEY (course_id) REFERENCES course(course_id),
      CONSTRAINT fk_course_offering_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id)
    )
  `);

  await execute(`
    CREATE TABLE assessment (
      assessment_id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      assessment_type VARCHAR2(60) NOT NULL,
      total_marks NUMBER(4) NOT NULL,
      weight NUMBER(5,2) NOT NULL,
      assessment_date DATE DEFAULT SYSDATE NOT NULL,
      course_offering_id NUMBER NOT NULL,
      CONSTRAINT fk_assessment_course_offering FOREIGN KEY (course_offering_id)
        REFERENCES course_offering(course_offering_id)
    )
  `);

  await execute(`
    CREATE TABLE grade_cutoffs (
      cutoff_id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      grade VARCHAR2(3) NOT NULL,
      min_marks NUMBER(5,2) NOT NULL,
      max_marks NUMBER(5,2) NOT NULL,
      course_offering_id NUMBER NOT NULL,
      CONSTRAINT fk_cutoff_course_offering FOREIGN KEY (course_offering_id)
        REFERENCES course_offering(course_offering_id)
    )
  `);

  await execute(`
    CREATE TABLE sgpa (
      student_id VARCHAR2(255) NOT NULL,
      semester NUMBER(2) NOT NULL,
      academic_year NUMBER(4) NOT NULL,
      gpa NUMBER(4,2) NOT NULL,
      CONSTRAINT pk_sgpa PRIMARY KEY (student_id, semester, academic_year),
      CONSTRAINT fk_sgpa_student FOREIGN KEY (student_id) REFERENCES student(email)
    )
  `);

  await execute(`
    CREATE TABLE attends (
      student_mail VARCHAR2(255) NOT NULL,
      course_offering_id NUMBER NOT NULL,
      enrollment_date DATE NOT NULL,
      status VARCHAR2(20) NOT NULL,
      CONSTRAINT pk_attends PRIMARY KEY (student_mail, course_offering_id),
      CONSTRAINT fk_attends_student FOREIGN KEY (student_mail) REFERENCES student(email),
      CONSTRAINT fk_attends_course_offering FOREIGN KEY (course_offering_id)
        REFERENCES course_offering(course_offering_id)
    )
  `);

  await execute(`
    CREATE TABLE attempts (
      student_mail VARCHAR2(255) NOT NULL,
      assessment_id NUMBER NOT NULL,
      attempt_date DATE NOT NULL,
      marks_obtained NUMBER(5,2) NOT NULL,
      CONSTRAINT pk_attempts PRIMARY KEY (student_mail, assessment_id),
      CONSTRAINT fk_attempts_student FOREIGN KEY (student_mail) REFERENCES student(email),
      CONSTRAINT fk_attempts_assessment FOREIGN KEY (assessment_id) REFERENCES assessment(assessment_id)
    )
  `);

  await execute(`
    CREATE OR REPLACE FUNCTION GetGrade(
      p_score NUMBER,
      p_course_offering_id NUMBER
    ) RETURN VARCHAR2
    IS
      v_grade VARCHAR2(3);
    BEGIN
      SELECT grade
        INTO v_grade
        FROM grade_cutoffs
       WHERE p_score BETWEEN min_marks AND max_marks
         AND course_offering_id = p_course_offering_id
       ORDER BY min_marks DESC
       FETCH FIRST 1 ROW ONLY;

      RETURN v_grade;
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        RETURN 'F';
    END;
  `);

  await execute(`
    CREATE OR REPLACE PROCEDURE GetTotalMarks(
      p_student IN VARCHAR2,
      p_total OUT NUMBER
    )
    IS
    BEGIN
      SELECT NVL(ROUND(SUM((at.marks_obtained / NULLIF(asmt.total_marks, 0)) * asmt.weight), 2), 0)
        INTO p_total
        FROM attempts at
        JOIN assessment asmt ON asmt.assessment_id = at.assessment_id
       WHERE at.student_mail = p_student;
    END;
  `);

  await execute(`
    CREATE OR REPLACE PROCEDURE ClassReport(
      p_course_offering_id IN NUMBER,
      p_average OUT NUMBER,
      p_highest OUT NUMBER,
      p_lowest OUT NUMBER
    )
    IS
    BEGIN
      SELECT NVL(ROUND(AVG(at.marks_obtained), 2), 0),
             NVL(MAX(at.marks_obtained), 0),
             NVL(MIN(at.marks_obtained), 0)
        INTO p_average, p_highest, p_lowest
        FROM attempts at
        JOIN assessment asmt ON asmt.assessment_id = at.assessment_id
       WHERE asmt.course_offering_id = p_course_offering_id;
    END;
  `);

  await execute(`
    CREATE OR REPLACE TRIGGER check_weight
    FOR INSERT OR UPDATE ON assessment
    COMPOUND TRIGGER
      TYPE t_course_ids IS TABLE OF NUMBER INDEX BY PLS_INTEGER;
      g_course_ids t_course_ids;
      g_index PLS_INTEGER := 0;

      BEFORE EACH ROW IS
      BEGIN
        g_index := g_index + 1;
        g_course_ids(g_index) := :NEW.course_offering_id;
      END BEFORE EACH ROW;

      AFTER STATEMENT IS
        v_total NUMBER;
      BEGIN
        FOR i IN 1 .. g_index LOOP
          SELECT NVL(SUM(weight), 0)
            INTO v_total
            FROM assessment
           WHERE course_offering_id = g_course_ids(i);

          IF v_total > 100 THEN
            RAISE_APPLICATION_ERROR(-20002, 'Total assessment weight exceeds 100');
          END IF;
        END LOOP;
      END AFTER STATEMENT;
    END;
  `);

  await execute(`
    CREATE OR REPLACE TRIGGER check_marks
    BEFORE INSERT OR UPDATE ON attempts
    FOR EACH ROW
    DECLARE
      v_max NUMBER;
    BEGIN
      SELECT total_marks
        INTO v_max
        FROM assessment
       WHERE assessment_id = :NEW.assessment_id;

      IF :NEW.marks_obtained < 0 OR :NEW.marks_obtained > v_max THEN
        RAISE_APPLICATION_ERROR(-20001, 'Marks exceed the maximum allowed for this assessment');
      END IF;
    END;
  `);

  await execute(`
    CREATE OR REPLACE VIEW v_student_course_progress AS
    SELECT
      a.student_mail,
      fo.course_offering_id,
      fo.academic_year,
      fo.semester,
      fo.branch,
      c.course_id,
      c.title AS course_title,
      c.course_type,
      c.credits,
      f.name AS faculty_name,
      NVL((
        SELECT ROUND(SUM(at.marks_obtained), 2)
        FROM attempts at
        JOIN assessment asmt ON asmt.assessment_id = at.assessment_id
        WHERE at.student_mail = a.student_mail
          AND asmt.course_offering_id = fo.course_offering_id
      ), 0) AS earned_raw,
      NVL((
        SELECT ROUND(SUM(asmt.total_marks), 2)
        FROM attempts at
        JOIN assessment asmt ON asmt.assessment_id = at.assessment_id
        WHERE at.student_mail = a.student_mail
          AND asmt.course_offering_id = fo.course_offering_id
      ), 0) AS possible_raw,
      NVL((
        SELECT ROUND(SUM((at.marks_obtained / NULLIF(asmt.total_marks, 0)) * asmt.weight), 2)
        FROM attempts at
        JOIN assessment asmt ON asmt.assessment_id = at.assessment_id
        WHERE at.student_mail = a.student_mail
          AND asmt.course_offering_id = fo.course_offering_id
      ), 0) AS weighted_total,
      CASE
        WHEN NVL((
          SELECT COUNT(*)
          FROM assessment asmt
          WHERE asmt.course_offering_id = fo.course_offering_id
        ), 0) = NVL((
          SELECT COUNT(*)
          FROM attempts at
          JOIN assessment asmt ON asmt.assessment_id = at.assessment_id
          WHERE at.student_mail = a.student_mail
            AND asmt.course_offering_id = fo.course_offering_id
        ), 0)
        THEN GetGrade(
          NVL((
            SELECT ROUND(SUM((at.marks_obtained / NULLIF(asmt.total_marks, 0)) * asmt.weight), 2)
            FROM attempts at
            JOIN assessment asmt ON asmt.assessment_id = at.assessment_id
            WHERE at.student_mail = a.student_mail
              AND asmt.course_offering_id = fo.course_offering_id
          ), 0),
          fo.course_offering_id
        )
        ELSE NULL
      END AS final_grade,
      a.status AS status
    FROM attends a
    JOIN course_offering fo ON fo.course_offering_id = a.course_offering_id
    JOIN course c ON c.course_id = fo.course_id
    JOIN faculty f ON f.faculty_id = fo.faculty_id
  `);

  await execute(`
    CREATE OR REPLACE VIEW v_student_profile AS
    SELECT
      s.email,
      s.username,
      s.branch,
      s.current_semester,
      s.current_year,
      NVL(ROUND(AVG(g.gpa), 2), 0) AS cgpa,
      NVL((
        SELECT sg.gpa
        FROM sgpa sg
        WHERE sg.student_id = s.email
        ORDER BY sg.academic_year DESC, sg.semester DESC
        FETCH FIRST 1 ROW ONLY
      ), 0) AS last_sgpa
    FROM student s
    LEFT JOIN sgpa g ON g.student_id = s.email
    GROUP BY s.email, s.username, s.branch, s.current_semester, s.current_year
  `);
}

function buildCourseOfferedRows(facultyIds: number[]) {
  const rows: Array<{
    academic_year: number;
    semester: number;
    status: string;
    branch: string;
    course_id: string;
    faculty_id: number;
  }> = [];

  branches.forEach((branch) => {
    (Object.entries(semesterCourses) as Array<[string, (typeof semesterCourses)[1]]>).forEach(
      ([semesterKey, courses], index) => {
        const semester = Number(semesterKey);
        courses.forEach((course, courseIndex) => {
          const facultyId = facultyIds[(index + branches.indexOf(branch) + courseIndex) % facultyIds.length];
          rows.push({
            academic_year: 2022 + semester,
            semester,
            status: semester === 4 ? "current" : "archived",
            branch,
            course_id: course.code,
            faculty_id: facultyId,
          });
        });
      },
    );
  });

  return rows;
}

async function seedData() {
  const facultyRows: Array<{
    name: string;
    email: string;
    password_hash: string;
    department: string;
  }> = [];
  for (const faculty of sampleFaculty) {
    facultyRows.push({
      name: faculty.username,
      email: faculty.email,
      password_hash: await hashPassword(faculty.password),
      department: faculty.department ?? "CSS",
    });
  }

  await executeMany(
    `INSERT INTO faculty (name, email, password_hash, department) VALUES (:name, :email, :password_hash, :department)`,
    facultyRows,
  );

  const facultyResult = await query<{ FACULTY_ID: number; EMAIL: string }>(
    `SELECT faculty_id, email FROM faculty ORDER BY faculty_id`,
  );
  const facultyIds = facultyResult.map((row) => Number(row.FACULTY_ID));

  const studentRows: Array<{
    email: string;
    username: string;
    password_hash: string;
    branch: string;
    graduation_year: number;
    current_semester: number;
    current_year: number;
    role: string;
  }> = [];
  for (const student of sampleStudents) {
    studentRows.push({
      email: student.email,
      username: student.username,
      password_hash: await hashPassword(student.password),
      branch: student.branch,
      graduation_year: student.graduationYear,
      current_semester: student.currentSemester,
      current_year: student.currentYear,
      role: student.role,
    });
  }

  await executeMany(
    `
      INSERT INTO student
        (email, username, password_hash, branch, graduation_year, current_semester, current_year, role)
      VALUES
        (:email, :username, :password_hash, :branch, :graduation_year, :current_semester, :current_year, :role)
    `,
    studentRows,
  );

  const courseRows = Object.values(semesterCourses).flatMap((courses) =>
    courses.map((course) => ({
      course_id: course.code,
      title: course.title,
      course_type: course.type,
      credits: course.credits,
      department: course.dept,
    })),
  );

  const uniqueCourseRows = Array.from(
    new Map(courseRows.map((course) => [course.course_id, course])).values(),
  );

  await executeMany(
    `
      INSERT INTO course (course_id, title, course_type, credits, department)
      VALUES (:course_id, :title, :course_type, :credits, :department)
    `,
    uniqueCourseRows,
  );

  const offeringRows = buildCourseOfferedRows(facultyIds);
  await executeMany(
    `
      INSERT INTO course_offering (academic_year, semester, status, branch, course_id, faculty_id)
      VALUES (:academic_year, :semester, :status, :branch, :course_id, :faculty_id)
    `,
    offeringRows,
  );

  const courseOfferingLookup = await query<CourseOfferingResult>(
    `
      SELECT course_offering_id, course_id, semester, branch, academic_year, status
      FROM course_offering
      ORDER BY course_offering_id
    `,
  );

  const assessmentRows: Array<{
    assessment_type: string;
    total_marks: number;
    weight: number;
    assessment_date: string;
    course_offering_id: number;
  }> = [];

  for (const offering of courseOfferingLookup) {
    const course = semesterCourses[Number(offering.SEMESTER) as 1 | 2 | 3 | 4].find(
      (row) => row.code === offering.COURSE_ID,
    );
    if (!course) continue;

    const plan = assessmentPlan(course.type);
    const assessmentMonth = String(Math.min(12, Number(offering.SEMESTER) * 2)).padStart(2, "0");
    plan.forEach((item, index) => {
      assessmentRows.push({
        assessment_type: item.label,
        total_marks: item.totalMarks,
        weight: item.weight,
        assessment_date: `${Number(offering.ACADEMIC_YEAR)}-${assessmentMonth}-${String(10 + index * 5).padStart(2, "0")}`,
        course_offering_id: Number(offering.COURSE_OFFERING_ID),
      });
    });
  }

  await executeMany(
    `
      INSERT INTO assessment (assessment_type, total_marks, weight, assessment_date, course_offering_id)
      VALUES (:assessment_type, :total_marks, :weight, TO_DATE(:assessment_date, 'YYYY-MM-DD'), :course_offering_id)
    `,
    assessmentRows,
  );

  const cutoffRows: Array<{
    grade: string;
    min_marks: number;
    max_marks: number;
    course_offering_id: number;
  }> = [];

  for (const offering of courseOfferingLookup) {
    cutoffRows.push(
      { grade: "A+", min_marks: 90, max_marks: 100, course_offering_id: Number(offering.COURSE_OFFERING_ID) },
      { grade: "A", min_marks: 80, max_marks: 89.99, course_offering_id: Number(offering.COURSE_OFFERING_ID) },
      { grade: "B", min_marks: 70, max_marks: 79.99, course_offering_id: Number(offering.COURSE_OFFERING_ID) },
      { grade: "C", min_marks: 60, max_marks: 69.99, course_offering_id: Number(offering.COURSE_OFFERING_ID) },
      { grade: "D", min_marks: 50, max_marks: 59.99, course_offering_id: Number(offering.COURSE_OFFERING_ID) },
      { grade: "E", min_marks: 40, max_marks: 49.99, course_offering_id: Number(offering.COURSE_OFFERING_ID) },
      { grade: "F", min_marks: 0, max_marks: 39.99, course_offering_id: Number(offering.COURSE_OFFERING_ID) },
    );
  }

  await executeMany(
    `
      INSERT INTO grade_cutoffs (grade, min_marks, max_marks, course_offering_id)
      VALUES (:grade, :min_marks, :max_marks, :course_offering_id)
    `,
    cutoffRows,
  );

  const attendRows: Array<{
    student_mail: string;
    course_offering_id: number;
    enrollment_date: string;
    status: string;
  }> = [];

  for (const offering of courseOfferingLookup) {
    const studentsForBranch = sampleStudents.filter((student) => student.branch === String(offering.BRANCH));
    for (const student of studentsForBranch) {
      attendRows.push({
        student_mail: student.email,
        course_offering_id: Number(offering.COURSE_OFFERING_ID),
        enrollment_date: `${Number(offering.ACADEMIC_YEAR)}-${String(Number(offering.SEMESTER)).padStart(2, "0")}-01`,
        status: Number(offering.SEMESTER) === 4 ? "true" : "false",
      });
    }
  }

  await executeMany(
    `
      INSERT INTO attends (student_mail, course_offering_id, enrollment_date, status)
      VALUES (:student_mail, :course_offering_id, TO_DATE(:enrollment_date, 'YYYY-MM-DD'), :status)
    `,
    attendRows,
  );

  const assessmentLookup = await query<AssessmentResult>(
    `
      SELECT assessment_id, course_offering_id, assessment_type, weight, total_marks
      FROM assessment
      ORDER BY assessment_id
    `,
  );

  const studentProfiles = sampleStudents.map((student, idx) => ({ ...student, index: idx + 1 }));
  const attemptRows: Array<{
    student_mail: string;
    assessment_id: number;
    attempt_date: string;
    marks_obtained: number;
  }> = [];

  for (const student of studentProfiles) {
    for (const relatedOffering of courseOfferingLookup) {
      if (relatedOffering.BRANCH !== student.branch) continue;

      const course = semesterCourses[Number(relatedOffering.SEMESTER) as 1 | 2 | 3 | 4].find(
        (row) => row.code === relatedOffering.COURSE_ID,
      );
      if (!course) continue;

      const offeringAssessments = assessmentLookup
        .filter((assessment) => Number(assessment.COURSE_OFFERING_ID) === Number(relatedOffering.COURSE_OFFERING_ID))
        .sort((left, right) => Number(left.ASSESSMENT_ID) - Number(right.ASSESSMENT_ID));

      const isCurrentSemester = Number(relatedOffering.SEMESTER) === Number(student.currentSemester ?? 0);
      const seededAssessments = isCurrentSemester ? offeringAssessments.slice(0, Math.min(2, offeringAssessments.length)) : offeringAssessments;

      for (const assessment of seededAssessments) {
        const maxMarks = Number(assessment.TOTAL_MARKS);
        const assessmentMonth = String(Math.min(12, Number(relatedOffering.SEMESTER) * 2)).padStart(2, "0");
        const seed =
          student.index * 1000 +
          Number(relatedOffering.SEMESTER) * 100 +
          Number(relatedOffering.COURSE_OFFERING_ID) +
          Number(assessment.ASSESSMENT_ID);
        const score = course.type === "Theory"
          ? randFromSeed(seed, Math.floor(maxMarks * 0.55), Math.floor(maxMarks * 0.95))
          : randFromSeed(seed, Math.floor(maxMarks * 0.65), Math.floor(maxMarks * 0.98));

        attemptRows.push({
          student_mail: student.email,
          assessment_id: Number(assessment.ASSESSMENT_ID),
          attempt_date: `${Number(relatedOffering.ACADEMIC_YEAR)}-${assessmentMonth}-${String(10 + (seed % 15)).padStart(2, "0")}`,
          marks_obtained: Math.min(maxMarks, score),
        });
      }
    }
  }

  await executeMany(
    `
      INSERT INTO attempts (student_mail, assessment_id, attempt_date, marks_obtained)
      VALUES (:student_mail, :assessment_id, TO_DATE(:attempt_date, 'YYYY-MM-DD'), :marks_obtained)
    `,
    attemptRows,
  );

  const sgpaRows = sampleStudents.flatMap((student) => {
    const semesterCourseRows = courseOfferingLookup.filter(
      (offering: CourseOfferingResult) =>
        offering.BRANCH === student.branch &&
        Number(offering.SEMESTER) < Number(student.currentSemester ?? 0),
    );
    const semesterGroups = new Map<number, CourseOfferingResult[]>();

    semesterCourseRows.forEach((offering: CourseOfferingResult) => {
      const semester = Number(offering.SEMESTER);
      semesterGroups.set(semester, [...(semesterGroups.get(semester) ?? []), offering]);
    });

    return Array.from(semesterGroups.entries()).map(([semester, offerings]) => {
      let totalWeightedPoints = 0;
      let totalCredits = 0;

      for (const offering of offerings) {
        const course = semesterCourses[semester as 1 | 2 | 3 | 4].find(
          (row) => row.code === offering.COURSE_ID,
        );
        if (!course) continue;

        const offeringAssessments = assessmentLookup.filter(
          (assessment) => Number(assessment.COURSE_OFFERING_ID) === Number(offering.COURSE_OFFERING_ID),
        );
        const weightedTotal = offeringAssessments.reduce((sum, assessment) => {
          const mark = attemptRows.find(
            (attempt) =>
              attempt.student_mail === student.email &&
              attempt.assessment_id === Number(assessment.ASSESSMENT_ID),
          );
          if (!mark) return sum;
          return sum + (mark.marks_obtained / assessment.TOTAL_MARKS) * assessment.WEIGHT;
        }, 0);
        const grade = getGradeFromScore(weightedTotal);
        totalWeightedPoints += (gradePoints[grade] ?? 0) * course.credits;
        totalCredits += course.credits;
      }

      const gpa = totalCredits > 0 ? Number((totalWeightedPoints / totalCredits).toFixed(2)) : 0;
      return {
        student_id: student.email,
        semester,
        academic_year: 2024 + Math.max(0, semester - 1),
        gpa,
      };
    });
  });

  await executeMany(
    `
      INSERT INTO sgpa (student_id, semester, academic_year, gpa)
      VALUES (:student_id, :semester, :academic_year, :gpa)
    `,
    sgpaRows,
  );
}

async function main() {
  await dropEverything();
  await createSchema();
  await seedData();
  console.log("Oracle schema reset and seeded.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

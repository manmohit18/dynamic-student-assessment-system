export type RoleSeed = {
  email: string;
  username: string;
  password: string;
  role: "student" | "faculty" | "admin";
  branch?: string;
  currentSemester?: number;
  currentYear?: number;
  graduationYear?: number;
  department?: string;
};

export type StudentSeed = RoleSeed & {
  branch: string;
  currentSemester: number;
  currentYear: number;
  graduationYear: number;
};

export type CourseOfferingResult = {
  COURSE_OFFERING_ID: number;
  COURSE_ID: string;
  SEMESTER: number;
  BRANCH: string;
  ACADEMIC_YEAR: number;
  STATUS: string;
};

export type AssessmentResult = {
  ASSESSMENT_ID: number;
  COURSE_OFFERING_ID: number;
  ASSESSMENT_TYPE: string;
  WEIGHT: number;
  TOTAL_MARKS: number;
};

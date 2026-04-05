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
  totalWeight: number;
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
  offeringStatus: string;
  courseId: string;
  courseTitle: string;
  courseType: string;
  credits: number;
  totalStudents: number;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
};

export type FacultyHistoricalOffering = {
  courseOfferingId: number;
  academicYear: number;
  semester: number;
  branch: string;
  offeringStatus: string;
  courseId: string;
  courseTitle: string;
  courseType: string;
  credits: number;
  enrolledStudents: number;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  cutoffs: Array<{
    grade: string;
    minMarks: number;
    maxMarks: number;
  }>;
  students: Array<{
    email: string;
    username: string;
    branch: string;
    status: string;
    finalGrade: string | null;
  }>;
};

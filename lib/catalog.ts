export type Branch = "CSE" | "CCE" | "IT" | "DSE" | "AIML";
export type Semester = 1 | 2 | 3 | 4;

export type CourseSeed = {
  code: string;
  title: string;
  type: "Theory" | "Lab";
  credits: number;
  dept: string;
};

export const branches: Branch[] = ["CSE", "CCE", "IT", "DSE", "AIML"];

export const semesterCourses: Record<Semester, CourseSeed[]> = {
  1: [
    {
      code: "MAT1102",
      title: "Computational Mathematics - I",
      type: "Theory",
      credits: 4,
      dept: "MAT",
    },
    {
      code: "PHY1002",
      title: "Applied Physics for Engineers",
      type: "Theory",
      credits: 3,
      dept: "PHY",
    },
    {
      code: "ECE1002",
      title: "Fundamentals of Electronics",
      type: "Theory",
      credits: 3,
      dept: "ECE",
    },
    {
      code: "CSS1001",
      title: "Programming for Problem Solving",
      type: "Theory",
      credits: 3,
      dept: "CSS",
    },
    {
      code: "MME1002",
      title: "Basic Mechanical Engineering Science",
      type: "Theory",
      credits: 3,
      dept: "MME",
    },
    {
      code: "HUM1001",
      title: "Communication Skills in English",
      type: "Theory",
      credits: 2,
      dept: "HUM",
    },
    {
      code: "HUM1002",
      title: "Universal Human Values and Professional Ethics",
      type: "Theory",
      credits: 1,
      dept: "HUM",
    },
    {
      code: "HUM1003",
      title: "Human Rights and Constitution",
      type: "Theory",
      credits: 1,
      dept: "HUM",
    },
    {
      code: "MME1011",
      title: "Workshop Practice",
      type: "Lab",
      credits: 1,
      dept: "MME",
    },
    {
      code: "CSS1011",
      title: "Programming for Problem Solving Lab",
      type: "Lab",
      credits: 1,
      dept: "CSS",
    },
  ],
  2: [
    {
      code: "MAT1202",
      title: "Computational Mathematics - II",
      type: "Theory",
      credits: 4,
      dept: "MAT",
    },
    {
      code: "CHM1002",
      title: "Applied Chemistry for Engineers",
      type: "Theory",
      credits: 3,
      dept: "CHM",
    },
    {
      code: "ELE1002",
      title: "Fundamentals of Electrical Engineering",
      type: "Theory",
      credits: 3,
      dept: "ELE",
    },
    {
      code: "CIV1002",
      title: "Engineering Mechanics and Smart Buildings",
      type: "Theory",
      credits: 3,
      dept: "CIV",
    },
    {
      code: "CSS1002",
      title: "Introduction to Object Oriented Programming",
      type: "Theory",
      credits: 3,
      dept: "CSS",
    },
    {
      code: "CIV1001",
      title: "Environmental Studies",
      type: "Lab",
      credits: 2,
      dept: "CIV",
    },
    {
      code: "CSS1012",
      title: "Data Visualisation",
      type: "Lab",
      credits: 2,
      dept: "CSS",
    },
    {
      code: "CSS1013",
      title: "Introduction to Object Oriented Programming Lab",
      type: "Lab",
      credits: 1,
      dept: "CSS",
    },
    {
      code: "MME1012",
      title: "Computer Aided Engineering Graphics",
      type: "Lab",
      credits: 1,
      dept: "MME",
    },
  ],
  3: [
    {
      code: "MAT1172",
      title: "Discrete Mathematical Structures",
      type: "Theory",
      credits: 3,
      dept: "MAT",
    },
    {
      code: "CSS2101",
      title: "Data Structures",
      type: "Theory",
      credits: 4,
      dept: "CSS",
    },
    {
      code: "CSS2102",
      title: "Data Communication and Computer Networks",
      type: "Theory",
      credits: 4,
      dept: "CSS",
    },
    {
      code: "CSS2103",
      title: "Data Analytics",
      type: "Theory",
      credits: 4,
      dept: "CSS",
    },
    {
      code: "CSS2104",
      title: "Digital Systems and Computer Organization",
      type: "Theory",
      credits: 4,
      dept: "CSS",
    },
    {
      code: "CSS2111",
      title: "Data Structures Lab",
      type: "Lab",
      credits: 1,
      dept: "CSS",
    },
    {
      code: "CSS2112",
      title: "Digital Systems Lab",
      type: "Lab",
      credits: 1,
      dept: "CSS",
    },
  ],
  4: [
    {
      code: "MAT1272",
      title: "Probability and Optimization",
      type: "Theory",
      credits: 3,
      dept: "MAT",
    },
    {
      code: "CSS2201",
      title: "Database Systems",
      type: "Theory",
      credits: 4,
      dept: "CSS",
    },
    {
      code: "CSS2202",
      title: "Design & Analysis of Algorithms",
      type: "Theory",
      credits: 4,
      dept: "CSS",
    },
    {
      code: "CSS2203",
      title: "Introduction to Artificial Intelligence",
      type: "Theory",
      credits: 4,
      dept: "CSS",
    },
    {
      code: "CSS2204",
      title: "Operating Systems",
      type: "Theory",
      credits: 4,
      dept: "CSS",
    },
    {
      code: "CSS2211",
      title: "Operating Systems Lab",
      type: "Lab",
      credits: 1,
      dept: "CSS",
    },
    {
      code: "CSS2212",
      title: "Database Lab",
      type: "Lab",
      credits: 1,
      dept: "CSS",
    },
    {
      code: "CSS2213",
      title: "Object-Oriented Software Development Lab",
      type: "Lab",
      credits: 2,
      dept: "CSS",
    },
  ],
};

export const gradeScale = [
  { grade: "A+", minMarks: 90 },
  { grade: "A", minMarks: 80 },
  { grade: "B+", minMarks: 70 },
  { grade: "B", minMarks: 60 },
  { grade: "C", minMarks: 50 },
  { grade: "D", minMarks: 40 },
  { grade: "F", minMarks: 0 },
] as const;

export function buildSubjectData() {
  const result: Record<string, Record<string, number>> = {};
  const semesters: Semester[] = [1, 2, 3, 4];

  branches.forEach((branch) => {
    semesters.forEach((semester) => {
      result[`${semester}-${branch}`] = Object.fromEntries(
        semesterCourses[semester].map((course) => [course.title, course.credits]),
      );
    });
  });

  return result;
}

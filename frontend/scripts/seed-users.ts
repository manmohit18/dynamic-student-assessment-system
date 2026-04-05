import { branches } from "../lib/catalog";
import type { RoleSeed, StudentSeed } from "../types/reset-oracle";

export const sampleFaculty: RoleSeed[] = [
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

const sampleNames = [
  "Aditi Sharma",
  "Arjun Verma",
  "Isha Reddy",
  "Kiran Nambiar",
  "Nikhil Joshi",
  "Pooja Bansal",
  "Rahul Kulkarni",
  "Sneha Menon",
  "Tanvi Rao",
  "Varun Gupta",
  "Yash Patil",
  "Zoya Khan",
  "Dev Malhotra",
  "Megha Sinha",
  "Nisha Kapoor",
  "Ritvik Das",
  "Saanvi Iyer",
  "Tushar Naik",
  "Anmol Chawla",
  "Bhavna Shetty",
  "Darsh Jain",
  "Farah Ali",
  "Gautam Pillai",
  "Harini Krishnan",
  "Irfan Qureshi",
  "Jiya Dutta",
  "Kavya Prasad",
  "Lakshya Arora",
  "Mitali Ghosh",
  "Naveen Bhatia",
];

export const sampleStudents: StudentSeed[] = branches.flatMap((branch, branchIndex) =>
  Array.from({ length: 6 }, (_, studentIndex) => {
    const globalIndex = branchIndex * 6 + studentIndex;
    const isPrimaryCseStudent = branch === "CSE" && studentIndex === 0;

    return {
      email: isPrimaryCseStudent
        ? "cse.student@college.edu"
        : `${branch.toLowerCase()}.student${studentIndex + 1}@college.edu`,
      username: isPrimaryCseStudent ? "Aarav Mehta" : sampleNames[globalIndex % sampleNames.length],
      password: "Student@123",
      role: "student",
      branch,
      currentSemester: 4,
      currentYear: 2025,
      graduationYear: 2027 + ((globalIndex + 1) % 2),
    };
  }),
);

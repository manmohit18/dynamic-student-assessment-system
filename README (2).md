# 🎓 Dynamic Student Assessment System

A full-stack web application for managing student assessments, grades, and academic performance. Built with **Next.js 16** on the frontend and **Oracle Database** as the backend, this system enables faculty to dynamically define assessments and grading policies, while students can track their marks, grades, and GPA — all in real time.

---

## ✨ Features

### 👨‍🏫 Faculty Portal
- View and manage course offerings
- Dynamically add, update, or remove assessment components (quizzes, assignments, exams) with custom weightages
- Enter and update student marks
- Define and modify grade cutoffs per course offering (e.g., A ≥ 85, B ≥ 70)
- View past assessment history per course

### 🎓 Student Portal
- Browse enrolled courses
- View marks obtained per assessment component
- See computed weighted total scores and assigned final grades
- Track semester-wise GPA (SGPA)
- View academic history across semesters

### 🗄️ Database Features
- Oracle DB backend with referential integrity enforced via foreign key constraints
- Triggers to prevent invalid mark entries and weight overflow (total weight > 100%)
- Stored procedures and functions for grade computation and class reports
- Dynamic grade cutoff application without schema changes

---

## 🗂️ Project Structure

```
dynamic-student-assessment-system/
├── frontend/                  # Next.js application
│   ├── app/                   # App Router pages & API routes
│   │   ├── api/
│   │   │   ├── auth/          # Login & logout endpoints
│   │   │   ├── courses/       # Course offering data
│   │   │   └── faculty/       # Assessment, marks, cutoffs, offering APIs
│   │   ├── courses/           # Student course browser page
│   │   ├── faculty/           # Faculty workspace & history pages
│   │   ├── gpa/               # GPA calculator page
│   │   └── history/           # Student marks history page
│   ├── components/            # React UI components
│   │   ├── faculty-workspace.tsx
│   │   ├── faculty-history-workbench.tsx
│   │   ├── student-portal.tsx
│   │   ├── student-course-browser.tsx
│   │   ├── history-workbench.tsx
│   │   ├── gpa-calculator.tsx
│   │   ├── login-panel.tsx
│   │   └── portal-header.tsx
│   ├── lib/                   # DB utilities and queries
│   │   ├── oracle.ts          # Oracle DB connection & query helpers
│   │   ├── db-queries.ts      # All SQL queries
│   │   ├── auth.ts            # Session/auth helpers
│   │   └── catalog.ts         # Course catalog utilities
│   ├── scripts/
│   │   ├── reset-oracle.ts    # DB schema reset script (DDL + seed)
│   │   └── seed-users.ts      # Seed initial users
│   └── types/                 # TypeScript type definitions
├── report/                    # Project report (PDF, LaTeX source)
└── specification.txt          # ER design, schema, SQL queries & normalization
```

---

## 🗃️ Database Schema

The system uses 9 normalized relational tables:

| Table | Description |
|---|---|
| `STUDENT` | Student accounts (email, branch, semester, year) |
| `FACULTY` | Faculty accounts (name, email, department) |
| `COURSE` | Course catalog (course_id, title, credits, type) |
| `COURSE_OFFERING` | Specific offering of a course (year, semester, branch, faculty) |
| `ASSESSMENT` | Assessment components with type, total marks, and weight |
| `ATTEMPTS` | Student marks per assessment |
| `ATTENDS` | Student enrollment per course offering, stores `final_grade` |
| `GRADE_CUTOFFS` | Grade boundaries per course offering |
| `SGPA` | Semester GPA records per student |

The schema satisfies **1NF, 2NF, 3NF, and BCNF**, with one intentional denormalization: `ATTENDS.final_grade` is persisted for performance and recomputed whenever marks or cutoffs are updated.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4, Radix UI |
| Database | Oracle Database (XE or higher) |
| ORM / Driver | `oracledb` (Node.js native driver) |
| Auth | Cookie-based sessions with `bcryptjs` password hashing |
| Package Manager | Bun |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ or [Bun](https://bun.sh/)
- Oracle Database (XE recommended) running locally or accessible remotely
- Oracle Instant Client installed and configured (required by `oracledb`)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/dynamic-student-assessment-system.git
cd dynamic-student-assessment-system/frontend
```

### 2. Install dependencies

```bash
bun install
# or
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your Oracle credentials:

```bash
cp .env.example .env.local
```

```env
ORACLE_USER=your_oracle_username
ORACLE_PASSWORD=your_oracle_password
ORACLE_CONNECTION_STRING=127.0.0.1:1521/XEPDB1
SESSION_COOKIE_NAME=session
```

### 4. Initialize the database

Run the reset script to create all tables, triggers, procedures, and seed data:

```bash
bun run db:reset
```

### 5. Start the development server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Available Scripts

| Script | Description |
|---|---|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:reset` | Reset Oracle DB schema and reseed data |

---

## 🔐 Authentication

- Role-based login for **Students** and **Faculty**
- Passwords stored as bcrypt hashes
- Session managed via HTTP-only cookies

---

## 📐 Key SQL Design

**Weighted total marks per student:**
```sql
SELECT a.student_mail,
       SUM((a.marks_obtained / b.total_marks) * b.weight) AS total_score
FROM ATTEMPTS a
JOIN ASSESSMENT b ON a.assessment_id = b.assessment_id
GROUP BY a.student_mail;
```

**Assign grades based on cutoffs:**
```sql
SELECT t.student_mail, t.total_score, g.grade
FROM (...weighted totals subquery...) t
JOIN GRADE_CUTOFFS g
  ON t.total_score BETWEEN g.min_marks AND g.max_marks;
```

**Triggers enforced at DB level:**
- `check_marks` — prevents marks from exceeding the assessment's total
- `check_weight` — prevents total assessment weight per course exceeding 100%

---

## 📄 Report

A full project report including the ER diagram, schema reduction, normalization analysis, and SQL documentation is available in the [`report/`](./report/) directory.

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## 📝 License

This project was developed as a Database Systems lab mini-project. See the report for academic context.

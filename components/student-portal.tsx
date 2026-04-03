"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourseProgress, StudentProfile } from "@/lib/db-queries";
import { ArrowUpRight, GraduationCap, Trophy } from "@/components/icons";

type StudentPortalProps = {
  profile: StudentProfile;
  courses: CourseProgress[];
};

type CourseDetail = {
  course: CourseProgress;
  assessments: Array<{
    assessmentId: number;
    assessmentType: string;
    totalMarks: number;
    weight: number;
    assessmentDate: string | null;
    marksObtained: number | null;
  }>;
};

export function StudentPortal({ profile, courses }: StudentPortalProps) {
  const [selected, setSelected] = useState<CourseProgress | null>(courses[0] ?? null);
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const currentCourses = useMemo(() => courses.filter((course) => course.semester === profile.currentSemester), [courses, profile.currentSemester]);
  const historyCourses = useMemo(() => courses.filter((course) => course.semester < profile.currentSemester), [courses, profile.currentSemester]);

  useEffect(() => {
    async function loadDetail() {
      if (!selected) return;
      const response = await fetch(`/api/courses/${selected.courseOfferingId}`);
      if (!response.ok) return;
      setDetail((await response.json()) as CourseDetail);
    }

    loadDetail();
  }, [selected]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <Card>
          <CardHeader>
            <Badge className="w-fit">Academic snapshot</Badge>
            <CardTitle className="mt-2 text-3xl">Welcome back, {profile.username}</CardTitle>
            <CardDescription>
              {profile.branch} student, semester {profile.currentSemester} of {profile.currentYear}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Stat icon={<GraduationCap className="h-4 w-4" />} label="CGPA" value={profile.cgpa.toFixed(2)} />
            <Stat icon={<Trophy className="h-4 w-4" />} label="Last SGPA" value={profile.lastSgpa.toFixed(2)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
            <CardDescription>Jump straight into courses or the GPA planner.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild variant="secondary">
              <Link href="/courses">
                Open courses
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/gpa">GPA calculator</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current semester</CardTitle>
            <CardDescription>Cards show marks earned versus marks available so far.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {currentCourses.map((course) => (
              <button
                key={course.courseOfferingId}
                onClick={() => setSelected(course)}
                className={`rounded-3xl border p-4 text-left transition-all ${
                  selected?.courseOfferingId === course.courseOfferingId
                    ? "border-amber-300/50 bg-amber-300/10"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{course.courseId}</p>
                <h4 className="mt-2 line-clamp-2 text-lg font-medium text-white">{course.courseTitle}</h4>
                <p className="mt-3 text-2xl font-semibold text-amber-200">
                  {course.earnedRaw}/{course.possibleRaw}
                </p>
                <p className="mt-1 text-sm text-slate-400">{course.facultyName}</p>
                {course.finalGrade ? <Badge className="mt-3">{course.finalGrade}</Badge> : null}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course detail</CardTitle>
            <CardDescription>Breakdown for the selected course.</CardDescription>
          </CardHeader>
          <CardContent>
            {detail ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                    {detail.course.courseId} • {detail.course.courseType}
                  </p>
                  <h4 className="mt-2 text-xl font-medium text-white">{detail.course.courseTitle}</h4>
                  <p className="mt-2 text-sm text-slate-300">
                    {detail.course.earnedRaw}/{detail.course.possibleRaw} raw marks earned so far.
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    Status: {detail.course.status}
                    {detail.course.finalGrade ? ` • Grade ${detail.course.finalGrade}` : ""}
                  </p>
                </div>

                <div className="space-y-3">
                  {detail.assessments.map((assessment) => (
                    <div key={assessment.assessmentId} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{assessment.assessmentType}</p>
                        <p className="text-xs text-slate-400">
                          {assessment.totalMarks} marks • {assessment.weight} weight
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-amber-200">
                        {assessment.marksObtained ?? "NA"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Select a course to inspect its assessment breakdown.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Past semesters</CardTitle>
            <CardDescription>Completed courses and the grade earned in each.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {historyCourses.map((course) => (
              <div key={course.courseOfferingId} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <p className="font-medium text-white">{course.courseTitle}</p>
                  <p className="text-xs text-slate-400">
                    Semester {course.semester} {course.academicYear}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-300">
                    {course.earnedRaw}/{course.possibleRaw}
                  </p>
                  <Badge className="mt-1">{course.finalGrade ?? "Pending"}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grade planner</CardTitle>
            <CardDescription>The GPA calculator now lives on its own page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/gpa">Open GPA calculator</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs uppercase tracking-[0.3em]">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

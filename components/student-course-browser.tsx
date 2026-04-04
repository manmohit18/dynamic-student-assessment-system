"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourseProgress, StudentProfile } from "@/lib/db-queries";
import { ArrowUpRight, CalendarRange, GraduationCap } from "@/components/icons";

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

type StudentCourseBrowserProps = {
  profile: StudentProfile;
  courses: CourseProgress[];
};

export function StudentCourseBrowser({ profile, courses }: StudentCourseBrowserProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const currentCourses = useMemo(
    () => courses.filter((course) => course.status === "true"),
    [courses],
  );
  const selected = useMemo(
    () => currentCourses.find((course) => course.courseOfferingId === selectedId) ?? currentCourses[0] ?? null,
    [currentCourses, selectedId],
  );

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
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.95fr]">
        <Card>
          <CardHeader>
            <Badge className="w-fit">Current semester</Badge>
            <CardTitle className="mt-2 text-3xl">Semester {profile.currentSemester} course cards</CardTitle>
            <CardDescription>Each card shows earned versus available marks so far.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {currentCourses.map((course) => (
              <button
                key={course.courseOfferingId}
                onClick={() => setSelectedId(course.courseOfferingId)}
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
                    Status: {detail.course.status === "true" ? "Ongoing" : "Past"}
                    {detail.course.finalGrade ? ` • Grade ${detail.course.finalGrade}` : ""}
                  </p>
                </div>

                <div className="space-y-3">
                  {detail.assessments.map((assessment) => (
                    <div
                      key={assessment.assessmentId}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-white">{assessment.assessmentType}</p>
                        <p className="text-xs text-slate-400">
                          {assessment.totalMarks} marks • {assessment.weight} weight
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-amber-200">{assessment.marksObtained ?? "NA"}</p>
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
            <CardTitle>Semester tools</CardTitle>
            <CardDescription>History and GPA planning live on separate pages now.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href="/history">
                Past semesters
                <CalendarRange className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/gpa">
                GPA calculator
                <GraduationCap className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Back to overview</CardTitle>
            <CardDescription>Return to the compact profile dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/">
                Open home
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

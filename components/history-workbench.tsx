"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  ChevronRight,
  ClipboardList,
  Trophy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourseDetailAssessment, CourseProgress, StudentProfile } from "@/types/db-queries";

type CourseDetail = {
  course: CourseProgress;
  assessments: CourseDetailAssessment[];
};

type HistoryWorkbenchProps = {
  profile: StudentProfile;
  courses: CourseProgress[];
};

export function HistoryWorkbench({ profile, courses }: HistoryWorkbenchProps) {
  const groupedCourses = useMemo(() => {
    const bySemester = courses.reduce((map, course) => {
      const bucket = map.get(course.semester) ?? [];
      bucket.push(course);
      map.set(course.semester, bucket);
      return map;
    }, new Map<number, CourseProgress[]>());

    return Array.from(bySemester.entries())
      .map(([semester, semesterCourses]) => ({
        semester,
        semesterCourses,
        credits: semesterCourses.reduce((sum, course) => sum + course.credits, 0),
      }))
      .sort((left, right) => right.semester - left.semester);
  }, [courses]);

  const semesterOptions = useMemo(() => groupedCourses.map((group) => group.semester), [groupedCourses]);
  const completedCredits = useMemo(() => courses.reduce((sum, course) => sum + course.credits, 0), [courses]);
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<number | null>(courses[0]?.courseOfferingId ?? null);
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const visibleGroups = useMemo(() => {
    if (selectedSemester === "all") return groupedCourses;
    const semesterNumber = Number(selectedSemester);
    return groupedCourses.filter((group) => group.semester === semesterNumber);
  }, [groupedCourses, selectedSemester]);

  const visibleCourses = useMemo(
    () => visibleGroups.flatMap((group) => group.semesterCourses),
    [visibleGroups],
  );

  const selectedCourse = useMemo(
    () => visibleCourses.find((course) => course.courseOfferingId === selectedId) ?? visibleCourses[0] ?? null,
    [selectedId, visibleCourses],
  );

  useEffect(() => {
    if (!visibleCourses.length) {
      setSelectedId(null);
      setDetail(null);
      return;
    }

    setSelectedId((current) =>
      current && visibleCourses.some((course) => course.courseOfferingId === current)
        ? current
        : visibleCourses[0].courseOfferingId,
    );
  }, [visibleCourses]);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (!selectedCourse) {
        setDetail(null);
        return;
      }

      setLoadingDetail(true);
      try {
        const response = await fetch(`/api/courses/${selectedCourse.courseOfferingId}`);
        if (!response.ok) {
          if (!cancelled) {
            setDetail(null);
          }
          return;
        }

        const payload = (await response.json()) as CourseDetail;
        if (!cancelled) {
          setDetail(payload);
        }
      } finally {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedCourse]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-6">
          <div className="rounded-4xl border border-stone-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Badge className="w-fit border-stone-200 bg-white text-slate-700">Transcript archive</Badge>
                <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Past semesters for {profile.username}</h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Filter by semester, then open any completed course to inspect its assessment trail and final grade.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard icon={BadgeCheck} label="Credits finished" value={String(completedCredits)} />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <label className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
                  <span className="text-xs uppercase tracking-[0.28em] text-slate-500">Semester</span>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="bg-transparent text-sm text-slate-900 outline-none"
                  >
                    <option value="all" className="bg-white text-slate-900">
                      All
                    </option>
                    {semesterOptions.map((semester) => (
                      <option key={semester} value={String(semester)} className="bg-white text-slate-900">
                        Semester {semester}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-4xl border border-stone-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-amber-600" />
                Semester archive
              </CardTitle>
              <CardDescription>
                {selectedSemester === "all"
                  ? "Finished semesters, grouped from newest to oldest."
                  : `Showing semester ${selectedSemester}.`}
              </CardDescription>
            </CardHeader>
            <div className="space-y-5">
              {visibleGroups.length ? (
                visibleGroups.map(({ semester, semesterCourses, credits }) => (
                  <div key={semester} className="space-y-3 rounded-3xl border border-stone-200 bg-stone-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Semester {semester}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {semesterCourses.length} course{semesterCourses.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <Badge className="border-stone-200 bg-white text-slate-700">{credits} credits</Badge>
                    </div>

                    <div className="grid gap-3">
                      {semesterCourses.map((course) => {
                        const active = selectedCourse?.courseOfferingId === course.courseOfferingId;

                        return (
                          <button
                            key={course.courseOfferingId}
                            type="button"
                            onClick={() => setSelectedId(course.courseOfferingId)}
                            className={`group rounded-[1.4rem] border p-4 text-left transition-colors cursor-pointer ${
                              active
                                ? "border-amber-300/60 bg-amber-50"
                                : "border-stone-200 bg-white hover:border-stone-300"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{course.courseId}</p>
                                <h3 className="text-lg font-medium text-slate-900">{course.courseTitle}</h3>
                                <p className="text-sm text-slate-600">{course.facultyName}</p>
                              </div>

                              <ChevronRight
                                className={`mt-1 h-5 w-5 transition-transform ${
                                  active ? "text-amber-600" : "text-slate-400 group-hover:translate-x-1 group-hover:text-slate-600"
                                }`}
                              />
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                              <span>{course.courseType}</span>
                              <span>•</span>
                              <span>{course.credits} credits</span>
                              <span>•</span>
                              <span>{course.academicYear}</span>
                              <span>•</span>
                              <span>Semester {course.semester}</span>
                            </div>

                            <div className="mt-3 flex items-end justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Final</p>
                                <p className="mt-1 text-2xl font-semibold text-amber-700">
                                  {course.finalGrade ?? "Pending"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Score</p>
                                <p className="mt-1 text-sm text-slate-800">
                                  {course.weightedTotal}/{course.totalWeight}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-[1.4rem] border border-dashed border-stone-200 bg-white px-4 py-6 text-sm text-slate-500">
                  No completed semesters match the selected filter.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="sticky top-24 h-fit self-start rounded-4xl border border-stone-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
          <CardHeader>
            <Badge className="w-fit border-stone-200 bg-white text-slate-700">Course dossier</Badge>
            <CardTitle className="mt-2 text-3xl font-serif text-slate-900">
              {selectedCourse?.courseTitle ?? "Select a course"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCourse ? (
              detail ? (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoTile label="Faculty" value={detail.course.facultyName} />
                    <InfoTile label="Course type" value={detail.course.courseType} />
                    <InfoTile label="Semester" value={`Semester ${detail.course.semester}`} />
                    <InfoTile label="Grade" value={detail.course.finalGrade ?? "Pending"} />
                  </div>

                  <div className="rounded-[1.6rem] border border-stone-200 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Transcript summary</p>
                    <div className="mt-3 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Score</p>
                        <p className="mt-1 text-3xl font-semibold text-slate-900">
                          {detail.course.weightedTotal}/{detail.course.totalWeight}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">
                        Individual assessments
                      </h3>
                      <Badge className="border-stone-200 bg-white text-slate-700">
                        {detail.assessments.length} items
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {detail.assessments.map((assessment) => {
                        const percentage =
                          assessment.marksObtained === null
                            ? null
                            : Math.round((assessment.marksObtained / assessment.totalMarks) * 100);

                        return (
                          <div key={assessment.assessmentId} className="rounded-[1.4rem] border border-stone-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-medium text-slate-900">{assessment.assessmentType}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.28em] text-slate-500">
                                  {assessment.assessmentDate ?? "Date pending"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-amber-700">
                                  {assessment.marksObtained ?? "NA"}
                                </p>
                                <p className="text-xs text-slate-500">of {assessment.totalMarks}</p>
                              </div>
                            </div>

                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
                              <div
                                className="h-full rounded-full bg-linear-to-r from-amber-500 to-sky-500"
                                style={{ width: `${percentage ?? 0}%` }}
                              />
                            </div>

                            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                              <span>{assessment.weight}% weight</span>
                              <span>{percentage === null ? "Pending" : `${percentage}%`}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-[1.4rem] border border-stone-200 bg-stone-50 p-5">
                    <div className="flex items-center gap-3 text-slate-700">
                      <Trophy className="h-5 w-5 text-amber-600" />
                      <span>Loading course dossier</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      {loadingDetail ? "Fetching assessments from Oracle..." : "Preparing the transcript entry."}
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-stone-200 bg-white p-6 text-sm text-slate-500">
                No completed course is selected. Choose one from the left archive to inspect its assessment marks.
              </div>
            )}
          </CardContent>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-stone-200 bg-white p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4 text-amber-600" />
        <span className="text-xs uppercase tracking-[0.3em]">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
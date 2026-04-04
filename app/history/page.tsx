import { cookies } from "next/headers";
import Link from "next/link";

import { decodeSession } from "@/lib/auth";
import { getStudentCourses, getStudentProfile } from "@/lib/db-queries";
import { LoginPanel } from "@/components/login-panel";
import { PortalHeader } from "@/components/portal-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function HistoryPage() {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get("course_portal_session")?.value);

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4">
        <LoginPanel />
      </main>
    );
  }

  if (session.role !== "student") {
    return (
      <>
        <PortalHeader name={session.email} role={session.role} />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Past semesters</CardTitle>
              <CardDescription>This page is reserved for student transcript history.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/faculty" className="text-amber-200 underline">
                Open faculty workspace
              </Link>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const profile = await getStudentProfile(session.email);
  const courses = await getStudentCourses(session.email);

  if (!profile) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4">
        <LoginPanel />
      </main>
    );
  }

  const pastCourses = courses.filter((course) => course.status === "false");
  const groups = Array.from(
    pastCourses
      .reduce((map, course) => {
        const bucket = map.get(course.semester) ?? [];
        bucket.push(course);
        map.set(course.semester, bucket);
        return map;
      }, new Map<number, typeof pastCourses>())
      .entries(),
  ).sort(([left], [right]) => right - left);

  return (
    <>
      <PortalHeader name={profile.username} role={session.role} />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <Badge className="w-fit">History</Badge>
              <CardTitle className="mt-2 text-3xl">Past semesters for {profile.username}</CardTitle>
              <CardDescription>Completed courses and the grade earned in each.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="secondary">
                <Link href="/courses">Back to current courses</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/gpa">Open GPA calculator</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transcript snapshot</CardTitle>
              <CardDescription>Grouped by semester and ordered by the course list you were enrolled in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {groups.length ? (
                groups.map(([semester, semesterCourses]) => (
                  <div key={semester} className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Semester {semester}</p>
                    <div className="space-y-2">
                      {semesterCourses.map((course) => (
                        <div
                          key={course.courseOfferingId}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                        >
                          <div>
                            <p className="font-medium text-white">{course.courseTitle}</p>
                            <p className="text-xs text-slate-400">
                              {course.courseId} • {course.academicYear}
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
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No completed semesters found yet.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}

import { cookies } from "next/headers";
import Link from "next/link";

import { decodeSession } from "@/lib/auth";
import { getStudentCourses, getStudentProfile } from "@/lib/db-queries";
import { LoginPanel } from "@/components/login-panel";
import { PortalHeader } from "@/components/portal-header";
import { StudentCourseBrowser } from "@/components/student-course-browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CoursesPage() {
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
              <CardTitle>Student course view only</CardTitle>
              <CardDescription>
                This page shows current semester cards and assessment breakdowns. Use the faculty workspace for
                uploads.
              </CardDescription>
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

  return (
    <>
      <PortalHeader name={profile.username} role={session.role} />
      <StudentCourseBrowser profile={profile} courses={courses} />
    </>
  );
}

import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { decodeSession } from "@/lib/auth";
import { getFacultyOfferings, getStudentCourses, getStudentProfile } from "@/lib/db-queries";
import { LoginPanel } from "@/components/login-panel";
import { PortalHeader } from "@/components/portal-header";
import { StudentPortal } from "@/components/student-portal";
import { FacultyWorkspace } from "@/components/faculty-workspace";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "@/components/icons";

export default async function Home() {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get("course_portal_session")?.value);

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-300">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Oracle course performance system
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-white sm:text-6xl">
              Oracle-backed course portal for marks, grades, and uploads.
            </h1>
            <p className="max-w-2xl text-lg text-slate-300">
              The database owns the grading logic. The frontend only reads the stored procedures, functions, and
              views from the Oracle schema.
            </p>

            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/courses">Browse courses</ButtonLink>
              <ButtonLink href="/gpa" variant="outline">
                GPA calculator
              </ButtonLink>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Seeded student login</CardTitle>
                  <CardDescription>cse.student@college.edu / Student@123</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Seeded faculty login</CardTitle>
                  <CardDescription>faculty.cse@college.edu / Faculty@123</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          <LoginPanel />
        </section>
      </main>
    );
  }

  if (session.role === "faculty") {
    const offerings = await getFacultyOfferings(session.email);
    return (
      <>
        <PortalHeader name={session.email} role={session.role} />
        <FacultyWorkspace offerings={offerings} />
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
      <StudentPortal profile={profile} courses={courses} />
    </>
  );
}

function ButtonLink({
  href,
  children,
  variant = "secondary",
}: {
  href: string;
  children: ReactNode;
  variant?: "secondary" | "outline";
}) {
  return (
    <Button asChild variant={variant}>
      <Link href={href}>
        {children}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  );
}

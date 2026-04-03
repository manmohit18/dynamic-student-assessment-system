import Link from "next/link";
import { cookies } from "next/headers";

import { decodeSession } from "@/lib/auth";
import { getStudentProfile } from "@/lib/db-queries";
import { GpaCalculator } from "@/components/gpa-calculator";
import { LoginPanel } from "@/components/login-panel";
import { PortalHeader } from "@/components/portal-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function GpaPage() {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get("course_portal_session")?.value);

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid w-full gap-8 lg:grid-cols-[0.95fr_0.85fr] lg:items-center">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-3xl text-white">GPA calculator</CardTitle>
              <CardDescription>
                Sign in to use the planner with your branch and semester defaults.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-300">
              <p>Use this page to estimate your semester GPA from hypothetical grade combinations.</p>
              <Button asChild variant="secondary">
                <Link href="/">Back to home</Link>
              </Button>
            </CardContent>
          </Card>
          <LoginPanel />
        </section>
      </main>
    );
  }

  const profile = session.role === "student" ? await getStudentProfile(session.email) : null;
  const defaultBranch = profile?.branch ?? "CSE";
  const defaultSemester = profile?.currentSemester ?? 4;

  return (
    <>
      <PortalHeader name={profile?.username ?? session.email} role={session.role} />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <CardHeader>
              <CardTitle>GPA calculator</CardTitle>
              <CardDescription>
                Estimate a semester GPA by assigning grades to each course in the catalog.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <p>The calculator is separated from the dashboard so the home page stays focused on academic status.</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/courses">View courses</Link>
              </Button>
            </CardContent>
          </Card>

          <GpaCalculator defaultBranch={defaultBranch} defaultSemester={defaultSemester} />
        </section>
      </main>
    </>
  );
}

import Link from "next/link";
import { cookies } from "next/headers";

import { GpaCalculator } from "@/components/gpa-calculator";
import { LoginPanel } from "@/components/login-panel";
import { PortalHeader } from "@/components/portal-header";
import { decodeSession } from "@/lib/auth";
import { getStudentProfile } from "@/lib/db-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, BookOpen, CalendarRange, ClipboardList, Sparkles, type LucideIcon } from "lucide-react";

export default async function GpaPage() {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get("course_portal_session")?.value);

  if (!session) {
    return (
      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_24%)]" />
        <section className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-4xl border border-stone-200 bg-white/90 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-9">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-100 blur-3xl" />
              <div className="relative space-y-5">
                <Badge className="w-fit border-amber-200 bg-amber-50 text-amber-900">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  GPA planning studio
                </Badge>
                <div className="space-y-3">
                  <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
                    Forecast a semester GPA with the actual catalog.
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                    Sign in to load your branch and semester defaults. The calculator mirrors the Oracle-backed subject
                    structure so you can test grade combinations before they exist in the transcript.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <InfoCard icon={BookOpen} label="Catalog aware" value="Branch-matched" />
                  <InfoCard icon={CalendarRange} label="Semester ready" value="Defaults loaded" />
                  <InfoCard icon={ClipboardList} label="Oracle backed" value="Real weights" />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button asChild variant="secondary">
                    <Link href="/courses">
                      Current courses
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/history">
                      Past semesters
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <Card className="border-stone-200 bg-white/90">
              <CardHeader>
                <CardTitle>How the calculator behaves</CardTitle>
                <CardDescription>Designed to keep planning readable even on small screens.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <StepCard
                  index="01"
                  title="Pick a semester"
                  body="Switch between first-year cycles and upper-semester branches."
                />
                <StepCard
                  index="02"
                  title="Assign grades"
                  body="Enter the grade you expect to test for every subject."
                />
                <StepCard
                  index="03"
                  title="Read the projection"
                  body="Get the weighted result instantly from the catalog."
                />
              </CardContent>
            </Card>
          </div>

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
      <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <GpaCalculator
          defaultBranch={defaultBranch}
          defaultSemester={defaultSemester}
          currentBranch={profile?.branch}
          currentSemester={profile?.currentSemester}
          currentCgpa={profile?.cgpa}
        />
      </main>
    </>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-stone-200 bg-white p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4 text-amber-600" />
        <span className="text-xs uppercase tracking-[0.3em]">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function StepCard({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div className="rounded-[1.4rem] border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{index}</p>
      <p className="mt-3 text-base font-medium text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { decodeSession } from "@/lib/auth";
import { getFacultyOfferings, getStudentProfile, getStudentSgpaHistory } from "@/lib/db-queries";
import { LoginPanel } from "@/components/login-panel";
import { PortalHeader } from "@/components/portal-header";
import { StudentPortal } from "@/components/student-portal";
import { FacultyWorkspace } from "@/components/faculty-workspace";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpenText, Sparkles } from "@/components/icons";

export default async function Home() {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get("course_portal_session")?.value);

  if (!session) {
    return (
      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.1),transparent_26%)]" />
        <section className="grid w-full gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="space-y-7">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-300">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Oracle course portal
              </div>
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-white sm:text-6xl">
                Marks, semesters, and course history in one place.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                The portal stays focused on the academic record. No clutter, no filler, just the current course view,
                history, and GPA planning backed by Oracle.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/courses">Browse courses</ButtonLink>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <Pill>Seeded student login: cse.student@college.edu</Pill>
              <Pill>Seeded faculty login: faculty.cse@college.edu</Pill>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MiniStat label="Student record" value="CGPA, SGPA, transcript" />
              <MiniStat label="Course data" value="Current and past offerings" />
              <MiniStat label="Faculty tools" value="Marks and uploads" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-4xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-8">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-400 text-slate-950">
                  <BookOpenText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Oracle-backed workflow</p>
                  <p className="text-lg font-medium text-white">Open the portal, then log in</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Students land on a compact dashboard. Faculty move straight into marks and offerings.
              </p>
            </div>

            <LoginPanel />
          </div>
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
  if (!profile) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4">
        <LoginPanel />
      </main>
    );
  }

  const sgpaHistory = await getStudentSgpaHistory(session.email);

  return (
    <>
      <PortalHeader name={profile.username} role={session.role} />
      <StudentPortal profile={profile} sgpaHistory={sgpaHistory} />
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

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">{children}</span>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm leading-6 text-white">{value}</p>
    </div>
  );
}

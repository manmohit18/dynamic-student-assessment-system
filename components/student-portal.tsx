"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { StudentProfile, StudentSgpaRecord } from "@/lib/db-queries";
import { ArrowUpRight, CalendarRange, GraduationCap, Trophy } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";

type StudentPortalProps = {
  profile: StudentProfile;
  sgpaHistory: StudentSgpaRecord[];
};

export function StudentPortal({ profile, sgpaHistory }: StudentPortalProps) {
  const history = sgpaHistory ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-4xl border border-white/10 bg-slate-950/65 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge className="w-fit">Academic snapshot</Badge>
            <CardTitle className="text-3xl sm:text-4xl">Welcome back, {profile.username}</CardTitle>
            <CardDescription>
              {profile.branch} student, semester {profile.currentSemester} of {profile.currentYear}
            </CardDescription>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Metric icon={<GraduationCap className="h-4 w-4" />} label="CGPA" value={profile.cgpa.toFixed(2)} />
            <Metric icon={<Trophy className="h-4 w-4" />} label="Last SGPA" value={profile.lastSgpa.toFixed(2)} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-4xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>SGPA history</CardTitle>
              <CardDescription>Recent semester GPA values, newest first.</CardDescription>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {history.length ? (
              history.slice(0, 3).map((record) => (
                <div
                  key={`${record.academicYear}-${record.semester}`}
                  className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full border border-amber-300/30 bg-amber-300/10 p-2 text-amber-200">
                      <CalendarRange className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Semester {record.semester}</p>
                      <p className="text-xs text-slate-400">{record.academicYear}</p>
                    </div>
                  </div>
                  <Badge className="text-sm">{record.gpa.toFixed(2)}</Badge>
                </div>
              ))
            ) : (
              <p className="rounded-3xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                No completed semester GPA records yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-8">
          <div className="space-y-3">
            <CardTitle>Quick links</CardTitle>
            <CardDescription>Use the dedicated pages for current courses and history.</CardDescription>
          </div>
          <div className="mt-5 flex flex-col gap-3">
            <Button asChild variant="secondary">
              <Link href="/courses">
                Current courses
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/history">History</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: {
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

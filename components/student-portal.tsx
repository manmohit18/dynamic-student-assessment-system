"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { StudentProfile, StudentSgpaRecord } from "@/lib/db-queries";
import { ArrowUpRight, CalendarRange, GraduationCap, Trophy } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type StudentPortalProps = {
  profile: StudentProfile;
  sgpaHistory: StudentSgpaRecord[];
};

export function StudentPortal({ profile, sgpaHistory }: StudentPortalProps) {
  const history = sgpaHistory ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
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
            <CardTitle>SGPA history</CardTitle>
            <CardDescription>Recent semester GPA values, newest first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {history.length ? (
                history.slice(0, 3).map((record) => (
                  <div
                    key={`${record.academicYear}-${record.semester}`}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
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
                <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                  No completed semester GPA records yet.
                </p>
              )}
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/history">View full history</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
            <CardDescription>Use the dedicated pages for current courses and planning.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild variant="secondary">
              <Link href="/courses">
                Current courses
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/gpa">GPA calculator</Link>
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

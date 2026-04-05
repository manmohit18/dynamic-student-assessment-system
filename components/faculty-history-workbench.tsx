"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { FacultyHistoricalOffering } from "@/types/db-queries";

type FacultyHistoryWorkbenchProps = {
  offerings: FacultyHistoricalOffering[];
};

export function FacultyHistoryWorkbench({ offerings }: FacultyHistoryWorkbenchProps) {
  const [selectedYear, setSelectedYear] = useState("all");

  const archivedOfferings = useMemo(
    () => offerings.filter((offering) => offering.offeringStatus !== "current"),
    [offerings],
  );

  const academicYears = useMemo(
    () => Array.from(new Set(archivedOfferings.map((offering) => offering.academicYear))).sort((a, b) => b - a),
    [archivedOfferings],
  );

  const visibleOfferings = useMemo(() => {
    if (selectedYear === "all") return archivedOfferings;
    return archivedOfferings.filter((offering) => offering.academicYear === Number(selectedYear));
  }, [archivedOfferings, selectedYear]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <Card className="border-stone-200 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <CardHeader className="space-y-4">
          <div>
            <Badge className="w-fit">Archive</Badge>
            <CardTitle className="mt-2 text-3xl text-slate-900">Teaching history</CardTitle>
            <CardDescription>
              Past offerings with enrolled students, class performance, and grade cutoff bands.
            </CardDescription>
          </div>
          <div className="max-w-xs">
            <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="all">All academic years</option>
              {academicYears.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>
      </Card>

      {visibleOfferings.length ? (
        <section className="grid gap-4 md:grid-cols-2">
          {visibleOfferings.map((offering) => (
            <Card
              key={offering.courseOfferingId}
              className="border-stone-200 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
            >
              <CardHeader>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{offering.courseId}</p>
                <CardTitle className="text-xl text-slate-900">{offering.courseTitle}</CardTitle>
                <CardDescription>
                  Semester {offering.semester} • {offering.branch} • {offering.courseType}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Students enrolled</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{offering.enrolledStudents}</p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Class average</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{offering.averageMarks.toFixed(2)}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">High / Low</p>
                  <p className="mt-2 text-base font-medium text-slate-900">
                    {offering.highestMarks} / {offering.lowestMarks}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Grade cutoffs</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {offering.cutoffs.map((cutoff) => (
                      <Badge key={`${offering.courseOfferingId}-${cutoff.grade}`} className="border-stone-200 bg-white text-slate-700">
                        {cutoff.grade}: {cutoff.minMarks}-{cutoff.maxMarks}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <Card className="border-stone-200 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <CardContent className="py-8 text-sm text-slate-500">
            No historical offerings found for the selected filters.
          </CardContent>
        </Card>
      )}
    </main>
  );
}

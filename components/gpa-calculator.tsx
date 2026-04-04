"use client";

import { useMemo, useState } from "react";

import { subjectData } from "@/app/gpa/subjects";
import { Calculator } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

const gradePoints: Record<string, number> = {
  "A+": 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  E: 5,
  F: 0,
};

const firstYearStreams = ["CSE", "NONCS"] as const;
const firstYearCycles = ["PHY", "CHM"] as const;
const honorsPattern = /honors/i;
const upperSemesterOptions = Array.from(
  new Set(
    Object.keys(subjectData)
      .map((key) => key.split("-"))
      .filter(([semester, branch]) => Number(semester) >= 3 && branch)
      .map(([, branch]) => branch),
  ),
);
const upperBranchOptions = upperSemesterOptions.filter((item) => item !== "CSE");

type GpaCalculatorProps = {
  defaultBranch?: string;
  defaultSemester?: number;
  currentBranch?: string;
  currentSemester?: number;
  currentCgpa?: number;
};

function clampSemester(value: number) {
  return Math.min(8, Math.max(1, Math.trunc(value)));
}

function normalizeUpperBranch(branch: string) {
  return branch === "CSE" ? "CSE" : branch;
}

function normalizeFirstYearStream(branch: string) {
  return branch === "CSE" ? "CSE" : "NONCS";
}

function isHonorsSubject(name: string) {
  return honorsPattern.test(name);
}

export function GpaCalculator({
  defaultBranch = "CSE",
  defaultSemester = 4,
  currentBranch,
  currentSemester,
  currentCgpa,
}: GpaCalculatorProps) {
  const [semester, setSemester] = useState(String(clampSemester(defaultSemester)));
  const [branch, setBranch] = useState(() => normalizeUpperBranch(defaultBranch));
  const [stream, setStream] = useState(() => normalizeFirstYearStream(defaultBranch));
  const [cycle, setCycle] = useState<"PHY" | "CHM">("PHY");
  const [includeHonors, setIncludeHonors] = useState(false);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [result, setResult] = useState<number | null>(null);
  const [calculatedFor, setCalculatedFor] = useState<string | null>(null);

  const semesterNumber = Number(semester);
  const isFirstYear = semesterNumber <= 2;
  const resolvedStream = isFirstYear
    ? firstYearStreams.includes(stream as (typeof firstYearStreams)[number])
      ? stream
      : normalizeFirstYearStream(defaultBranch)
    : stream;
  const resolvedCycle = isFirstYear
    ? firstYearCycles.includes(cycle as (typeof firstYearCycles)[number])
      ? cycle
      : "PHY"
    : cycle;
  const resolvedBranch = isFirstYear
    ? branch
    : upperSemesterOptions.includes(branch)
      ? branch
      : normalizeUpperBranch(defaultBranch);
  const subjectKey = isFirstYear ? `${semesterNumber}-${resolvedStream}-${resolvedCycle}` : `${semesterNumber}-${resolvedBranch}`;
  const subjects = useMemo(() => subjectData[subjectKey] ?? {}, [subjectKey]);
  const subjectEntries = useMemo(() => Object.entries(subjects), [subjects]);
  const regularSubjectEntries = useMemo(
    () => subjectEntries.filter(([name]) => !isHonorsSubject(name)),
    [subjectEntries],
  );
  const honorsSubjectEntries = useMemo(
    () => subjectEntries.filter(([name]) => isHonorsSubject(name)),
    [subjectEntries],
  );
  const honorsEnabled = semesterNumber >= 7 && includeHonors;
  const selectionKey = `${semesterNumber}-${isFirstYear ? `${resolvedStream}-${resolvedCycle}` : resolvedBranch}-${honorsEnabled ? "honors" : "regular"}`;
  const normalizedCurrentBranch = currentBranch ? normalizeUpperBranch(currentBranch) : null;
  const branchMatchesCurrent = isFirstYear
    ? true
    : normalizedCurrentBranch !== null
      ? resolvedBranch === normalizedCurrentBranch
      : false;
  const projectedCgpa =
    result !== null &&
    currentSemester !== undefined &&
    currentCgpa !== undefined &&
    semesterNumber === currentSemester &&
    branchMatchesCurrent
      ? Number(((currentCgpa * Math.max(0, currentSemester - 1) + result) / Math.max(1, currentSemester)).toFixed(2))
      : null;

  function calculate() {
    const visibleSubjects = honorsEnabled ? subjectEntries : regularSubjectEntries;
    const totalCredits = visibleSubjects.reduce((sum, [, credits]) => sum + credits, 0);
    const points = visibleSubjects.reduce((sum, [name, credits]) => {
      const grade = grades[name];
      return sum + credits * (grade ? gradePoints[grade] ?? 0 : 0);
    }, 0);

    setResult(totalCredits ? Number((points / totalCredits).toFixed(2)) : 0);
    setCalculatedFor(selectionKey);
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
      <div className="rounded-4xl border border-stone-200 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500 text-white shadow-[0_10px_30px_rgba(180,83,9,0.16)]">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-2xl text-slate-900">GPA calculator</CardTitle>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Select value={semester} onChange={(e) => setSemester(e.target.value)}>
            {Array.from({ length: 8 }, (_, index) => index + 1).map((item) => (
              <option key={item} value={String(item)}>
                Semester {item}
              </option>
            ))}
          </Select>

          {isFirstYear ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Select value={stream} onChange={(e) => setStream(e.target.value)}>
                {firstYearStreams.map((item) => (
                  <option key={item} value={item}>
                    Stream {item}
                  </option>
                ))}
              </Select>
              <Select value={cycle} onChange={(e) => setCycle(e.target.value as "PHY" | "CHM") }>
                {firstYearCycles.map((item) => (
                  <option key={item} value={item}>
                    Cycle {item}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="CSE">CSE</option>
              {upperBranchOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          )}

          {semesterNumber >= 7 ? (
            <label className="flex items-center justify-between gap-4 rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3">
              <span>
                <span className="block font-medium text-slate-900">Include honors subjects</span>
                <span className="block text-xs text-slate-600">
                  Toggle this to show the honors courses in the selected semester.
                </span>
              </span>
              <input
                type="checkbox"
                checked={includeHonors}
                onChange={(e) => setIncludeHonors(e.target.checked)}
                className="h-5 w-5 rounded border-stone-300 bg-white text-amber-600 focus:ring-amber-400/20"
              />
            </label>
          ) : null}
        </div>

        <Button className="mt-5 w-full" onClick={calculate}>
          Calculate GPA
        </Button>

        {result !== null && calculatedFor === selectionKey ? (
          <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">Projected GPA</p>
            <div className="mt-3 flex items-end gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Predicted SGPA</p>
                <p className="mt-2 text-4xl font-semibold text-slate-900">{result}</p>
              </div>
              {projectedCgpa !== null ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Predicted CGPA</p>
                  <p className="mt-2 text-4xl font-semibold text-slate-900">{projectedCgpa}</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-4xl border border-stone-200 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.76fr] lg:items-start">
          <div>
            <CardTitle className="text-xl text-slate-900">Subjects</CardTitle>
            <p className="mt-1 text-sm text-slate-600">Enter the grade you want to test for each subject.</p>

            <div className="mt-5 space-y-3">
              {regularSubjectEntries.map(([name, credits]) => (
                <div key={name} className="grid gap-3 rounded-3xl border border-stone-200 bg-stone-50 p-3 md:grid-cols-[1fr_160px]">
                  <div>
                    <p className="font-medium text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500">{credits} credits</p>
                  </div>
                  <Select
                    value={grades[name] ?? ""}
                    onChange={(e) => setGrades((current) => ({ ...current, [name]: e.target.value }))}
                  >
                    <option value="">Grade</option>
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                    <option value="F">F</option>
                  </Select>
                </div>
              ))}

              {honorsEnabled ? (
                honorsSubjectEntries.length > 0 ? (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-amber-700/80">Honors subjects</p>
                    {honorsSubjectEntries.map(([name, credits]) => (
                      <div
                        key={name}
                        className="grid gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-3 md:grid-cols-[1fr_160px]"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{name}</p>
                          <p className="text-xs text-slate-500">{credits} credits</p>
                        </div>
                        <Select
                          value={grades[name] ?? ""}
                          onChange={(e) => setGrades((current) => ({ ...current, [name]: e.target.value }))}
                        >
                          <option value="">Grade</option>
                          <option value="A+">A+</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="E">E</option>
                          <option value="F">F</option>
                        </Select>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-500">
                    No honors subjects are defined for this semester.
                  </div>
                )
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

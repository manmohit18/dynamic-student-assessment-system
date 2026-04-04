"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "@/components/icons";
import { Select } from "@/components/ui/select";
import { buildSubjectData, branches } from "@/lib/catalog";

const subjectData = buildSubjectData();
const gradePoints: Record<string, number> = {
  "A+": 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  E: 5,
  F: 0,
};

type GpaCalculatorProps = {
  defaultBranch?: string;
  defaultSemester?: number;
};

export function GpaCalculator({ defaultBranch = "CSE", defaultSemester = 4 }: GpaCalculatorProps) {
  const [branch, setBranch] = useState(defaultBranch);
  const [semester, setSemester] = useState(String(defaultSemester));
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [result, setResult] = useState<number | null>(null);

  const subjectKey = `${semester}-${branch}`;
  const subjects = useMemo(() => subjectData[subjectKey] ?? {}, [subjectKey]);
  const subjectNames = Object.keys(subjects);

  function calculate() {
    const totalCredits = subjectNames.reduce((sum, name) => sum + (subjects[name] ?? 0), 0);
    const points = subjectNames.reduce((sum, name) => {
      const grade = grades[name];
      return sum + (subjects[name] ?? 0) * (grade ? gradePoints[grade] ?? 0 : 0);
    }, 0);

    setResult(totalCredits ? Number((points / totalCredits).toFixed(2)) : 0);
  }

  return (
    <Card className="border-amber-300/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-amber-300" />
          <CardTitle>GPA calculator</CardTitle>
        </div>
        <CardDescription>Pick a semester and branch, then test a hypothetical grade mix.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
            {branches.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
          </Select>
        </div>

        <div className="mt-4 space-y-3">
          {subjectNames.map((name) => (
            <div key={name} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-3 md:grid-cols-[1fr_160px]">
              <div>
                <p className="font-medium text-white">{name}</p>
                <p className="text-xs text-slate-400">{subjects[name]} credits</p>
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

        <Button className="mt-4 w-full" onClick={calculate}>
          Calculate GPA
        </Button>

        {result !== null ? (
          <div className="mt-4 rounded-3xl border border-emerald-400/25 bg-emerald-400/10 p-5 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">Projected GPA</p>
            <p className="mt-2 text-4xl font-semibold text-white">{result}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

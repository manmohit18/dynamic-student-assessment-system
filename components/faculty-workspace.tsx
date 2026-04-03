"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Upload } from "@/components/icons";

type FacultyWorkspaceProps = {
  offerings: Array<{
    courseOfferingId: number;
    academicYear: number;
    semester: number;
    branch: string;
    courseId: string;
    courseTitle: string;
    courseType: string;
    credits: number;
    totalStudents: number;
    averageMarks: number;
    highestMarks: number;
    lowestMarks: number;
  }>;
};

type OfferingDetail = {
  offering: {
    courseOfferingId: number;
    academicYear: number;
    semester: number;
    branch: string;
    courseId: string;
    courseTitle: string;
    courseType: string;
    credits: number;
    facultyName: string;
  };
  report: { average: number; highest: number; lowest: number };
  assessments: Array<{
    assessmentId: number;
    assessmentType: string;
    totalMarks: number;
    weight: number;
    assessmentDate: string;
  }>;
  students: Array<{
    email: string;
    username: string;
    branch: string;
    status: string;
    weightedTotal: number;
    rawTotal: number;
    rawPossible: number;
    finalGrade: string | null;
  }>;
};

export function FacultyWorkspace({ offerings }: FacultyWorkspaceProps) {
  const [selectedOfferingId, setSelectedOfferingId] = useState<number>(offerings[0]?.courseOfferingId ?? 0);
  const [detail, setDetail] = useState<OfferingDetail | null>(null);
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [submission, setSubmission] = useState<Record<string, string>>({});

  const selectedOffering = useMemo(
    () => offerings.find((offering) => offering.courseOfferingId === selectedOfferingId) ?? offerings[0] ?? null,
    [offerings, selectedOfferingId],
  );

  useEffect(() => {
    async function loadDetail() {
      if (!selectedOfferingId) return;
      const response = await fetch(`/api/faculty/offering/${selectedOfferingId}`);
      if (!response.ok) return;
      const data = (await response.json()) as OfferingDetail;
      setDetail(data);
      setAssessmentId(data.assessments[0]?.assessmentId ?? null);
      setSubmission(Object.fromEntries(data.students.map((student) => [student.email, ""])));
    }

    loadDetail();
  }, [selectedOfferingId]);

  async function saveMarks() {
    if (!assessmentId || !detail) return;
    await fetch("/api/faculty/marks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assessmentId,
        marks: Object.entries(submission).map(([studentEmail, marksObtained]) => ({
          studentEmail,
          marksObtained: Number(marksObtained),
        })),
      }),
    });

    const response = await fetch(`/api/faculty/offering/${selectedOfferingId}`);
    if (response.ok) {
      const refreshed = (await response.json()) as OfferingDetail;
      setDetail(refreshed);
      setSubmission(Object.fromEntries(refreshed.students.map((student) => [student.email, ""])));
    }
  }

  if (!selectedOffering) return null;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <Badge className="w-fit">Faculty tools</Badge>
            <CardTitle className="mt-2 text-3xl">Assessment upload workspace</CardTitle>
            <CardDescription>Select a course offering and push marks to Oracle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={String(selectedOfferingId)} onChange={(e) => setSelectedOfferingId(Number(e.target.value))}>
              {offerings.map((offering) => (
                <option key={offering.courseOfferingId} value={offering.courseOfferingId}>
                  {offering.courseTitle} - Sem {offering.semester} {offering.branch}
                </option>
              ))}
            </Select>

            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Students" value={String(selectedOffering.totalStudents)} />
              <Metric label="Avg" value={selectedOffering.averageMarks.toFixed(2)} />
              <Metric label="High / Low" value={`${selectedOffering.highestMarks} / ${selectedOffering.lowestMarks}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedOffering.courseTitle}</CardTitle>
            <CardDescription>
              {selectedOffering.courseId} • {selectedOffering.courseType} • {selectedOffering.credits} credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detail ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Select
                    value={assessmentId ? String(assessmentId) : ""}
                    onChange={(e) => setAssessmentId(Number(e.target.value))}
                  >
                    <option value="">Choose assessment</option>
                    {detail.assessments.map((assessment) => (
                      <option key={assessment.assessmentId} value={assessment.assessmentId}>
                        {assessment.assessmentType}
                      </option>
                    ))}
                  </Select>
                  <Button onClick={saveMarks}>
                    <Upload className="mr-2 h-4 w-4" />
                    Save marks
                  </Button>
                </div>

                <div className="space-y-3">
                  {detail.students.map((student) => (
                    <div key={student.email} className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 md:grid-cols-[1.4fr_0.8fr_0.6fr]">
                      <div>
                        <p className="font-medium text-white">{student.username}</p>
                        <p className="text-xs text-slate-400">{student.email}</p>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={submission[student.email] ?? ""}
                        onChange={(e) => setSubmission((current) => ({ ...current, [student.email]: e.target.value }))}
                      />
                      <Badge className="justify-center">{student.finalGrade ?? "NA"}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Loading offering detail...</p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Course list</CardTitle>
          <CardDescription>Each card shows the progress snapshot for a faculty-owned offering.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {offerings.map((offering) => (
            <button
              key={offering.courseOfferingId}
              onClick={() => setSelectedOfferingId(offering.courseOfferingId)}
              className={`rounded-3xl border p-4 text-left transition-all ${
                selectedOfferingId === offering.courseOfferingId
                  ? "border-amber-300/50 bg-amber-300/10"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{offering.courseId}</p>
              <h4 className="mt-2 text-lg font-medium text-white">{offering.courseTitle}</h4>
              <p className="mt-2 text-sm text-slate-300">
                {offering.semester} / {offering.branch} • {offering.courseType}
              </p>
              <p className="mt-3 text-sm text-amber-200">
                {offering.averageMarks.toFixed(2)} avg, {offering.totalStudents} students
              </p>
            </button>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

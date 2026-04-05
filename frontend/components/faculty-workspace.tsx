"use client";

import Link from "next/link";
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
  cutoffs: Array<{
    grade: string;
    minMarks: number;
    maxMarks: number;
  }>;
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

const defaultCutoffGrades = ["A+", "A", "B", "C", "D", "E", "F"];

export function FacultyWorkspace({ offerings }: FacultyWorkspaceProps) {
  const [selectedOfferingId, setSelectedOfferingId] = useState<number>(offerings[0]?.courseOfferingId ?? 0);
  const [detail, setDetail] = useState<OfferingDetail | null>(null);
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [assessmentTotalMarks, setAssessmentTotalMarks] = useState("");
  const [assessmentWeight, setAssessmentWeight] = useState("");
  const [submission, setSubmission] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [cutoffDraft, setCutoffDraft] = useState<Record<string, string>>({});
  const [cutoffMessage, setCutoffMessage] = useState("");
  const [isSavingCutoffs, setIsSavingCutoffs] = useState(false);

  const selectedOffering = useMemo(
    () => offerings.find((offering) => offering.courseOfferingId === selectedOfferingId) ?? offerings[0] ?? null,
    [offerings, selectedOfferingId],
  );

  const selectedAssessment = useMemo(
    () => detail?.assessments.find((assessment) => assessment.assessmentId === assessmentId) ?? null,
    [detail, assessmentId],
  );

  useEffect(() => {
    async function loadDetail() {
      if (!selectedOfferingId) return;
      const response = await fetch(`/api/faculty/offering/${selectedOfferingId}`);
      if (!response.ok) return;
      const data = (await response.json()) as OfferingDetail;
      const firstAssessment = data.assessments[0] ?? null;
      setDetail(data);
      setAssessmentId(firstAssessment?.assessmentId ?? null);
      setSubmission(Object.fromEntries(data.students.map((student) => [student.email, ""])));
      setAssessmentTotalMarks(firstAssessment ? String(firstAssessment.totalMarks) : "");
      setAssessmentWeight(firstAssessment ? String(firstAssessment.weight) : "");
      setCutoffDraft(
        Object.fromEntries(
          (data.cutoffs.length ? data.cutoffs : defaultCutoffGrades.map((grade) => ({ grade, minMarks: 0, maxMarks: 0 }))).map((cutoff) => [
            cutoff.grade,
            String(cutoff.minMarks),
          ]),
        ),
      );
      setSaveMessage("");
      setCutoffMessage("");
    }

    loadDetail();
  }, [selectedOfferingId]);

  async function saveMarks() {
    if (!assessmentId || !detail) return;
    const totalMarks = Number(assessmentTotalMarks);
    const weight = Number(assessmentWeight);

    if (!Number.isFinite(totalMarks) || totalMarks <= 0 || !Number.isFinite(weight) || weight <= 0) {
      setSaveMessage("Enter valid positive values for total marks and weight.");
      return;
    }

    const rows = Object.entries(submission)
      .map(([studentEmail, marksObtained]) => ({ studentEmail, marksObtained: marksObtained.trim() }))
      .filter((row) => row.marksObtained !== "")
      .map((row) => ({ studentEmail: row.studentEmail, marksObtained: Number(row.marksObtained) }))
      .filter((row) => Number.isFinite(row.marksObtained));

    if (rows.length === 0) {
      setSaveMessage("Enter at least one mark before saving.");
      return;
    }

    setIsSaving(true);
    setSaveMessage("");
    const saveResponse = await fetch("/api/faculty/marks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assessmentId,
        totalMarks,
        weight,
        marks: rows,
      }),
    });

    if (!saveResponse.ok) {
      const payload = (await saveResponse.json().catch(() => null)) as { error?: string } | null;
      setSaveMessage(payload?.error ?? "Unable to save marks. Please try again.");
      setIsSaving(false);
      return;
    }

    const response = await fetch(`/api/faculty/offering/${selectedOfferingId}`);
    if (response.ok) {
      const refreshed = (await response.json()) as OfferingDetail;
      setDetail(refreshed);
      setSubmission(Object.fromEntries(refreshed.students.map((student) => [student.email, ""])));
      const refreshedSelected = refreshed.assessments.find((assessment) => assessment.assessmentId === assessmentId);
      if (refreshedSelected) {
        setAssessmentTotalMarks(String(refreshedSelected.totalMarks));
        setAssessmentWeight(String(refreshedSelected.weight));
      }
      setSaveMessage(`${rows.length} mark${rows.length === 1 ? "" : "s"} saved successfully.`);
    } else {
      setSaveMessage("Marks saved, but the updated view could not be refreshed.");
    }
    setIsSaving(false);
  }

  async function saveCutoffs() {
    if (!detail) return;

    const rows = Object.entries(cutoffDraft)
      .map(([grade, minMarks]) => ({ grade, minMarks: Number(minMarks) }))
      .filter((row) => Number.isFinite(row.minMarks))
      .sort((left, right) => right.minMarks - left.minMarks);

    if (rows.length === 0) {
      setCutoffMessage("Enter at least one valid cutoff.");
      return;
    }

    setIsSavingCutoffs(true);
    setCutoffMessage("");
    const response = await fetch("/api/faculty/cutoffs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseOfferingId: detail.offering.courseOfferingId,
        cutoffs: rows,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setCutoffMessage(payload?.error ?? "Unable to save cutoffs.");
      setIsSavingCutoffs(false);
      return;
    }

    const refreshed = await fetch(`/api/faculty/offering/${detail.offering.courseOfferingId}`);
    if (refreshed.ok) {
      const data = (await refreshed.json()) as OfferingDetail;
      setDetail(data);
      setSubmission(Object.fromEntries(data.students.map((student) => [student.email, ""])));
      setCutoffDraft(Object.fromEntries(data.cutoffs.map((cutoff) => [cutoff.grade, String(cutoff.minMarks)])));
    }

    setCutoffMessage("Cutoffs saved and grades recomputed.");
    setIsSavingCutoffs(false);
  }

  if (!selectedOffering) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="border-stone-200 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <Badge className="w-fit">Faculty tools</Badge>
            <CardTitle className="mt-2 text-3xl text-slate-900">No current course offerings</CardTitle>
            <CardDescription>
              There are no active offerings assigned right now. Open teaching history to inspect past classes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/faculty/history">Open teaching history</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-stone-200 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <Badge className="w-fit">Faculty tools</Badge>
            <CardTitle className="mt-2 text-3xl text-slate-900">Assessment upload workspace</CardTitle>
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

        <Card className="border-stone-200 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <CardTitle className="text-slate-900">{selectedOffering.courseTitle}</CardTitle>
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
                    onChange={(e) => {
                      const nextAssessmentId = Number(e.target.value);
                      setAssessmentId(nextAssessmentId);
                      const nextAssessment = detail?.assessments.find(
                        (assessment) => assessment.assessmentId === nextAssessmentId,
                      );
                      setAssessmentTotalMarks(nextAssessment ? String(nextAssessment.totalMarks) : "");
                      setAssessmentWeight(nextAssessment ? String(nextAssessment.weight) : "");
                    }}
                  >
                    <option value="">Choose assessment</option>
                    {detail.assessments.map((assessment) => (
                      <option key={assessment.assessmentId} value={assessment.assessmentId}>
                        {assessment.assessmentType} ({assessment.totalMarks})
                      </option>
                    ))}
                  </Select>
                  <Button onClick={saveMarks} disabled={isSaving}>
                    <Upload className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save marks"}
                  </Button>
                </div>

                {selectedAssessment ? (
                  <p className="text-sm text-slate-600">
                    Enter marks for <span className="font-medium text-slate-900">{selectedAssessment.assessmentType}</span> out of {selectedAssessment.totalMarks}.
                  </p>
                ) : null}

                {saveMessage ? <p className="text-sm text-slate-600">{saveMessage}</p> : null}

                <div className="grid gap-3 sm:grid-cols-2 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  <label className="space-y-1 text-sm text-slate-700">
                    <span>Total marks</span>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={assessmentTotalMarks}
                      onChange={(e) => setAssessmentTotalMarks(e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    <span>Weight</span>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={assessmentWeight}
                      onChange={(e) => setAssessmentWeight(e.target.value)}
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  {detail.students.map((student) => (
                    <div key={student.email} className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 md:grid-cols-[1.4fr_0.8fr_0.6fr]">
                      <div>
                        <p className="font-medium text-slate-900">{student.username}</p>
                        <p className="text-xs text-slate-500">{student.email}</p>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        max={assessmentTotalMarks || selectedAssessment?.totalMarks}
                        placeholder={assessmentTotalMarks ? `0 - ${assessmentTotalMarks}` : selectedAssessment ? `0 - ${selectedAssessment.totalMarks}` : "Enter marks"}
                        value={submission[student.email] ?? ""}
                        onChange={(e) => setSubmission((current) => ({ ...current, [student.email]: e.target.value }))}
                      />
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

      <Card className="border-stone-200 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <CardHeader>
          <CardTitle className="text-slate-900">Grade cutoffs</CardTitle>
          <CardDescription>Set minimum marks for each grade band for this offering.</CardDescription>
        </CardHeader>
        <CardContent>
          {detail ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-900">Minimum marks by grade</p>
                <Button size="sm" onClick={saveCutoffs} disabled={isSavingCutoffs}>
                  {isSavingCutoffs ? "Saving..." : "Save cutoffs"}
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {(detail.cutoffs.length ? detail.cutoffs : defaultCutoffGrades.map((grade) => ({ grade, minMarks: 0, maxMarks: 0 }))).map((cutoff) => (
                  <label key={`cutoff-${cutoff.grade}`} className="space-y-1 text-sm text-slate-700">
                    <span>{cutoff.grade}</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={cutoffDraft[cutoff.grade] ?? String(cutoff.minMarks)}
                      onChange={(e) =>
                        setCutoffDraft((current) => ({
                          ...current,
                          [cutoff.grade]: e.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
              {cutoffMessage ? <p className="text-sm text-slate-600">{cutoffMessage}</p> : null}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Select a course to edit grade cutoffs.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-stone-200 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <CardHeader>
            <CardTitle className="text-slate-900">Course list</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {offerings.map((offering) => (
            <button
              key={offering.courseOfferingId}
              onClick={() => setSelectedOfferingId(offering.courseOfferingId)}
              className={`rounded-3xl border p-4 text-left transition-all ${
                selectedOfferingId === offering.courseOfferingId
                  ? "border-amber-300/60 bg-amber-50"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{offering.courseId}</p>
              <h4 className="mt-2 text-lg font-medium text-slate-900">{offering.courseTitle}</h4>
              <p className="mt-2 text-sm text-slate-600">
                {offering.semester} / {offering.branch} • {offering.courseType}
              </p>
              <p className="mt-3 text-sm text-amber-700">
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
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

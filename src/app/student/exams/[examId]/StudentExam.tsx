"use client";

import { useEffect, useState } from "react";

type Option = { id: string; optionText: string };
type Question = { id: string; type: string; prompt: string; points: number; options: Option[] };
type Exam = { id: string; title: string; durationMinutes: number; windowStart: string; windowEnd: string; status: string; course: { name: string }; questions: { id: string; orderIndex: number; question: Question }[] };
type Attempt = { id: string; startedAt: string; submittedAt: string | null; status: string } | null;

export default function StudentExam({ examId }: { examId: string }) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<Attempt>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    fetch(`/api/student/exams/${examId}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Unable to load exam.");
        setExam(result.data.exam);
        setAttempt(result.data.attempt);
      })
      .catch((loadError: Error) => setError(loadError.message))
      .finally(() => setIsLoading(false));
  }, [examId]);

  async function startExam() {
    setError("");
    setIsStarting(true);
    try {
      const response = await fetch(`/api/student/exams/${examId}`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to start exam.");
      setExam(result.data.exam);
      setAttempt(result.data.attempt);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Unable to start exam.");
    } finally {
      setIsStarting(false);
    }
  }

  if (isLoading) return <p className="text-slate-400">Loading exam...</p>;
  if (error && !exam) return <p role="alert" className="text-red-400">{error}</p>;
  if (!exam) return <p className="text-slate-400">Exam not found.</p>;

  return (
    <section>
      <h1 className="text-4xl font-bold tracking-tight">{exam.title}</h1>
      <p className="mt-3 text-slate-400">{exam.course.name} · {exam.durationMinutes} minutes · {exam.questions.length} questions</p>
      {!attempt ? <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6"><p className="text-slate-300">Start this exam only when the scheduled window is open.</p><button type="button" onClick={startExam} disabled={isStarting} className="mt-5 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">{isStarting ? "Starting..." : "Start exam"}</button></div> : <div className="mt-8 space-y-5"><p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">Attempt started. Answer submission and timer enforcement will be added next.</p><ol className="space-y-4">{exam.questions.map(({ id, question }, index) => <li key={id} className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="font-medium">{index + 1}. {question.prompt} <span className="text-slate-500">({question.points} pt)</span></p><div className="mt-3 space-y-2">{question.options.map((option) => <label key={option.id} className="flex gap-3 text-sm text-slate-300"><input type="radio" name={question.id} value={option.id} disabled />{option.optionText}</label>)}</div></li>)}</ol></div>}
      {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}
    </section>
  );
}
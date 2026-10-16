"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const answersRef = useRef(answers);

  function updateAnswer(questionId: string, answer: string) {
    setAnswers((currentAnswers) => {
      const nextAnswers = { ...currentAnswers, [questionId]: answer };
      answersRef.current = nextAnswers;
      return nextAnswers;
    });
  }

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
      if (result.data.attempt) setRemainingSeconds(getRemainingSeconds(result.data.attempt.startedAt, result.data.exam));
      setRemainingSeconds(getRemainingSeconds(result.data.attempt.startedAt, result.data.exam));
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Unable to start exam.");
    } finally {
      setIsStarting(false);
    }
  }

  function getRemainingSeconds(startedAt: string, currentExam: Exam) {
    const deadline = Math.min(new Date(startedAt).getTime() + currentExam.durationMinutes * 60 * 1000, new Date(currentExam.windowEnd).getTime());
    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  }

  const submitAnswers = useCallback(async () => {
    if (!exam || !attempt || isSubmitting || attempt.status !== "IN_PROGRESS") return;
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/student/exams/${examId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: Object.entries(answersRef.current).map(([questionId, answer]) => exam.questions.find(({ question }) => question.id === questionId)?.question.type === "MCQ" ? { questionId, selectedOptionId: answer } : { questionId, answerText: answer }) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to submit exam.");
      setAttempt({ ...attempt, status: result.data.status, submittedAt: result.data.submittedAt });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit exam.");
    } finally {
      setIsSubmitting(false);
    }
  }, [attempt, exam, examId, isSubmitting]);

  useEffect(() => {
    if (!attempt || !exam || attempt.status !== "IN_PROGRESS") return;
    const logIntegrityEvent = (eventType: "TAB_SWITCH" | "FOCUS_LOSS" | "TIME_OUT") => {
      void fetch(`/api/student/exams/${examId}/integrity-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType }),
        keepalive: true,
      });
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") logIntegrityEvent("TAB_SWITCH");
    };
    const handleWindowBlur = () => logIntegrityEvent("FOCUS_LOSS");

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    const timer = window.setInterval(() => {
      const remaining = getRemainingSeconds(attempt.startedAt, exam);
      setRemainingSeconds(remaining);
      if (remaining === 0) {
        logIntegrityEvent("TIME_OUT");
        void submitAnswers();
      }
    }, 1000);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.clearInterval(timer);
    };
  }, [attempt, exam, examId, submitAnswers]);

  if (isLoading) return <p className="text-slate-400">Loading exam...</p>;
  if (error && !exam) return <p role="alert" className="text-red-400">{error}</p>;
  if (!exam) return <p className="text-slate-400">Exam not found.</p>;

  return (
    <section>
      <h1 className="text-4xl font-bold tracking-tight">{exam.title}</h1>
      <p className="mt-3 text-slate-400">{exam.course.name} · {exam.durationMinutes} minutes · {exam.questions.length} questions</p>
      {!attempt ? <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6"><p className="text-slate-300">Start this exam only when the scheduled window is open.</p><button type="button" onClick={startExam} disabled={isStarting} className="mt-5 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">{isStarting ? "Starting..." : "Start exam"}</button></div> : <div className="mt-8 space-y-5"><div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"><span>{attempt.status === "IN_PROGRESS" ? `Time remaining: ${Math.floor((remainingSeconds ?? 0) / 60)}:${String((remainingSeconds ?? 0) % 60).padStart(2, "0")}` : `Attempt ${attempt.status.toLowerCase()}.`}</span>{attempt.status === "IN_PROGRESS" ? <button type="button" onClick={() => void submitAnswers()} disabled={isSubmitting} className="rounded-lg bg-emerald-500 px-3 py-2 font-semibold text-slate-950 disabled:opacity-50">{isSubmitting ? "Submitting..." : "Submit exam"}</button> : <Link href={`/student/exams/${exam.id}/results` as Route} className="text-emerald-300">View result</Link>}</div><ol className="space-y-4">{exam.questions.map(({ id, question }, index) => <li key={id} className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="font-medium">{index + 1}. {question.prompt} <span className="text-slate-500">({question.points} pt)</span></p><div className="mt-3 space-y-2">{question.options.map((option) => <label key={option.id} className="flex gap-3 text-sm text-slate-300"><input type="radio" name={question.id} value={option.id} checked={answers[question.id] === option.id} onChange={() => updateAnswer(question.id, option.id)} disabled={attempt.status !== "IN_PROGRESS"} />{option.optionText}</label>)}</div></li>)}</ol></div>}
      {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}
    </section>
  );
}
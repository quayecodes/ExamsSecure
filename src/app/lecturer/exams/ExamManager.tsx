"use client";

import { FormEvent, useEffect, useState } from "react";

type Course = { id: string; name: string };
type Question = { id: string; prompt: string; type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER"; points: number };
type QuestionBank = { id: string; title: string; courseId: string; questions: Question[] };
type Exam = { id: string; title: string; durationMinutes: number; windowStart: string; windowEnd: string; status: string; course: { name: string }; _count: { questions: number } };

function toIsoDate(value: string) {
  return new Date(value).toISOString();
}

export default function ExamManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadExams() {
    const response = await fetch("/api/lecturer/exams");
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error ?? "Unable to load exams.");
    }

    setCourses(result.data.courses);
    setQuestionBanks(result.data.questionBanks);
    setExams(result.data.exams);
    setCourseId((currentCourseId) => currentCourseId || result.data.courses[0]?.id || "");
  }

  useEffect(() => {
    loadExams().catch((loadError: Error) => setError(loadError.message)).finally(() => setIsLoading(false));
  }, []);

  const courseQuestions = questionBanks.filter((bank) => bank.courseId === courseId).flatMap((bank) => bank.questions);

  function toggleQuestion(questionId: string) {
    setSelectedQuestionIds((current) => current.includes(questionId) ? current.filter((id) => id !== questionId) : [...current, questionId]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/lecturer/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, title, durationMinutes: Number(durationMinutes), windowStart: toIsoDate(windowStart), windowEnd: toIsoDate(windowEnd), questionIds: selectedQuestionIds, randomizeQuestions: true }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to create exam.");
      }

      setTitle("");
      setSelectedQuestionIds([]);
      setMessage("Draft exam created.");
      await loadExams();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create exam.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="text-slate-400">Loading exams...</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div><h2 className="text-xl font-semibold">Create draft exam</h2><p className="mt-2 text-sm text-slate-400">Schedule a future exam window and attach at least one course question.</p></div>
        <label className="block text-sm">Course<select value={courseId} onChange={(event) => { setCourseId(event.target.value); setSelectedQuestionIds([]); }} required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"><option value="">Select a course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label>
        <label className="block text-sm">Title<input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={2} maxLength={150} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
        <label className="block text-sm">Duration in minutes<input value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} type="number" min={1} max={480} required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">Starts<input value={windowStart} onChange={(event) => setWindowStart(event.target.value)} type="datetime-local" required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label><label className="block text-sm">Ends<input value={windowEnd} onChange={(event) => setWindowEnd(event.target.value)} type="datetime-local" required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label></div>
        <fieldset className="space-y-2"><legend className="text-sm">Questions ({selectedQuestionIds.length} selected)</legend>{courseQuestions.length ? courseQuestions.map((question) => <label key={question.id} className="flex gap-3 rounded-lg border border-slate-800 p-3 text-sm"><input type="checkbox" checked={selectedQuestionIds.includes(question.id)} onChange={() => toggleQuestion(question.id)} className="mt-1" /><span>{question.prompt}<span className="mt-1 block text-xs text-slate-500">{question.type} · {question.points} point{question.points === 1 ? "" : "s"}</span></span></label>) : <p className="text-sm text-amber-300">Create questions for this course before scheduling an exam.</p>}</fieldset>
        {message && <p role="status" className="text-sm text-emerald-400">{message}</p>}{error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={isSubmitting || !courseQuestions.length} className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">{isSubmitting ? "Creating..." : "Create draft exam"}</button>
      </form>
      <section aria-labelledby="exams-heading"><h2 id="exams-heading" className="text-xl font-semibold">Your exams</h2><p className="mt-2 text-sm text-slate-400">Drafts and scheduled exams for your courses.</p><div className="mt-5 space-y-3">{exams.length ? exams.map((exam) => <article key={exam.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5"><h3 className="font-semibold">{exam.title}</h3><p className="mt-1 text-sm text-slate-400">{exam.course.name} · {exam._count.questions} questions · {exam.durationMinutes} minutes</p><p className="mt-2 text-xs uppercase tracking-wide text-emerald-400">{exam.status}</p></article>) : <p className="rounded-xl border border-dashed border-slate-800 p-5 text-sm text-slate-400">No exams created yet.</p>}</div></section>
    </div>
  );
}
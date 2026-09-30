"use client";

import { FormEvent, useEffect, useState } from "react";

type Course = { id: string; name: string };
type QuestionBank = {
  id: string;
  title: string;
  course: Course;
  _count: { questions: number };
};

export default function QuestionBankManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadQuestionBanks() {
    const response = await fetch("/api/lecturer/question-banks");
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error ?? "Unable to load question banks.");
    }

    setCourses(result.data.courses);
    setQuestionBanks(result.data.questionBanks);
    setCourseId((currentCourseId) => currentCourseId || result.data.courses[0]?.id || "");
  }

  useEffect(() => {
    loadQuestionBanks()
      .catch((loadError: Error) => setError(loadError.message))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/lecturer/question-banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, title }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to create question bank.");
      }

      setTitle("");
      setMessage("Question bank created.");
      await loadQuestionBanks();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create question bank.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="text-slate-400">Loading question banks...</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <h2 className="text-xl font-semibold">Create a question bank</h2>
          <p className="mt-2 text-sm text-slate-400">Start a reusable collection of questions for one of your courses.</p>
        </div>
        <label className="block text-sm">
          Course
          <select value={courseId} onChange={(event) => setCourseId(event.target.value)} required disabled={!courses.length} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
            <option value="">Select a course</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={2} maxLength={120} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="e.g. Data Structures Midterm" />
        </label>
        {message && <p role="status" className="text-sm text-emerald-400">{message}</p>}
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={isSubmitting || !courses.length} className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">
          {isSubmitting ? "Creating..." : "Create question bank"}
        </button>
        {!courses.length && <p className="text-sm text-amber-300">You need an assigned course before creating a question bank.</p>}
      </form>

      <section aria-labelledby="question-banks-heading">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h2 id="question-banks-heading" className="text-xl font-semibold">Your question banks</h2>
            <p className="mt-2 text-sm text-slate-400">{questionBanks.length ? "Reusable question collections by course." : "No question banks have been created yet."}</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {questionBanks.map((questionBank) => (
            <article key={questionBank.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="font-semibold">{questionBank.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{questionBank.course.name} · {questionBank._count.questions} questions</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
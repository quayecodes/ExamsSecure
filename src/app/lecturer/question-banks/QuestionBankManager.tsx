"use client";

import { FormEvent, useEffect, useState } from "react";

type Course = { id: string; name: string };
type QuestionOption = { id: string; optionText: string; isCorrect: boolean };
type Question = {
  id: string;
  type: "MCQ" | "TRUE_FALSE";
  prompt: string;
  points: number;
  correctAnswer: string | null;
  options: QuestionOption[];
};
type QuestionBank = {
  id: string;
  title: string;
  course: Course;
  _count: { questions: number };
  questions: Question[];
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
  const [questionType, setQuestionType] = useState<"MCQ" | "TRUE_FALSE">("MCQ");
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [questionPoints, setQuestionPoints] = useState("1");
  const [correctAnswer, setCorrectAnswer] = useState("TRUE");
  const [options, setOptions] = useState(["", ""]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [isQuestionSubmitting, setIsQuestionSubmitting] = useState(false);

  async function loadQuestionBanks() {
    const response = await fetch("/api/lecturer/question-banks");
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error ?? "Unable to load question banks.");
    }

    setCourses(result.data.courses);
    setQuestionBanks(result.data.questionBanks);
    setCourseId((currentCourseId) => currentCourseId || result.data.courses[0]?.id || "");
    setSelectedBankId((currentBankId) => currentBankId || result.data.questionBanks[0]?.id || "");
  }

  async function handleQuestionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsQuestionSubmitting(true);

    try {
      const response = await fetch(`/api/lecturer/question-banks/${selectedBankId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: questionType,
          prompt: questionPrompt,
          points: Number(questionPoints),
          correctAnswer: questionType === "TRUE_FALSE" ? correctAnswer : undefined,
          options: questionType === "MCQ"
            ? options.map((optionText, index) => ({ optionText, isCorrect: index === 0 }))
            : undefined,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to create question.");
      }

      setQuestionPrompt("");
      setQuestionPoints("1");
      setOptions(["", ""]);
      setMessage("Question created.");
      await loadQuestionBanks();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create question.");
    } finally {
      setIsQuestionSubmitting(false);
    }
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

      <section aria-labelledby="question-banks-heading" className="space-y-8">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h2 id="question-banks-heading" className="text-xl font-semibold">Your question banks</h2>
            <p className="mt-2 text-sm text-slate-400">{questionBanks.length ? "Reusable question collections by course." : "No question banks have been created yet."}</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {questionBanks.map((questionBank) => (
            <article key={questionBank.id} className={`rounded-xl border p-5 ${selectedBankId === questionBank.id ? "border-emerald-500/60 bg-slate-900" : "border-slate-800 bg-slate-900/60"}`}>
              <button type="button" onClick={() => setSelectedBankId(questionBank.id)} className="text-left">
                <h3 className="font-semibold">{questionBank.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{questionBank.course.name} · {questionBank._count.questions} questions</p>
              </button>
              {selectedBankId === questionBank.id && questionBank.questions.length > 0 && (
                <ol className="mt-4 space-y-3 border-t border-slate-800 pt-4">
                  {questionBank.questions.map((question) => (
                    <li key={question.id} className="text-sm">
                      <p className="font-medium">{question.prompt} <span className="text-slate-500">({question.points} pt)</span></p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{question.type === "MCQ" ? "Multiple choice" : "True or false"}</p>
                    </li>
                  ))}
                </ol>
              )}
            </article>
          ))}
        </div>
        {selectedBankId && (
          <form onSubmit={handleQuestionSubmit} className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div>
              <h2 className="text-xl font-semibold">Add a question</h2>
              <p className="mt-2 text-sm text-slate-400">Add an objective question to the selected bank.</p>
            </div>
            <label className="block text-sm">Type<select value={questionType} onChange={(event) => setQuestionType(event.target.value as "MCQ" | "TRUE_FALSE")} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"><option value="MCQ">Multiple choice</option><option value="TRUE_FALSE">True or false</option></select></label>
            <label className="block text-sm">Question<input value={questionPrompt} onChange={(event) => setQuestionPrompt(event.target.value)} required minLength={2} maxLength={1000} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
            <label className="block text-sm">Points<input value={questionPoints} onChange={(event) => setQuestionPoints(event.target.value)} type="number" min={1} max={100} required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
            {questionType === "TRUE_FALSE" ? (
              <label className="block text-sm">Correct answer<select value={correctAnswer} onChange={(event) => setCorrectAnswer(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"><option value="TRUE">True</option><option value="FALSE">False</option></select></label>
            ) : (
              <fieldset className="space-y-3"><legend className="text-sm">Options (the first option is marked correct)</legend>{options.map((option, index) => <input key={index} value={option} onChange={(event) => setOptions((currentOptions) => currentOptions.map((currentOption, optionIndex) => optionIndex === index ? event.target.value : currentOption))} required maxLength={200} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder={`Option ${index + 1}`} />)}</fieldset>
            )}
            <button type="submit" disabled={isQuestionSubmitting} className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">{isQuestionSubmitting ? "Creating..." : "Create question"}</button>
          </form>
        )}
      </section>
    </div>
  );
}
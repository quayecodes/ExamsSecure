"use client";

import { FormEvent, useEffect, useState } from "react";

type Student = { id: string; fullName: string; email: string };

export default function AssignmentManager({ examId }: { examId: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/lecturer/exams/${examId}/assignments`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Unable to load students.");
        setStudents(result.data.students);
        setSelectedStudentIds(result.data.assignedStudentIds);
      })
      .catch((loadError: Error) => setError(loadError.message))
      .finally(() => setIsLoading(false));
  }, [examId]);

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((current) => current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/lecturer/exams/${examId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selectedStudentIds }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to assign exam.");
      setMessage(`${result.data.assignedCount} new assignment${result.data.assignedCount === 1 ? "" : "s"} created.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to assign exam.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <p className="text-slate-400">Loading students...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <fieldset className="space-y-3">
        <legend className="text-xl font-semibold">Students ({selectedStudentIds.length} selected)</legend>
        {students.length ? students.map((student) => <label key={student.id} className="flex gap-3 rounded-lg border border-slate-800 p-3 text-sm"><input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => toggleStudent(student.id)} className="mt-1" /><span><span className="block font-medium">{student.fullName}</span><span className="text-slate-400">{student.email}</span></span></label>) : <p className="text-sm text-amber-300">No students are available in this institution.</p>}
      </fieldset>
      {message && <p role="status" className="text-sm text-emerald-400">{message}</p>}
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={isSubmitting || !selectedStudentIds.length} className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">{isSubmitting ? "Assigning..." : "Assign exam"}</button>
    </form>
  );
}
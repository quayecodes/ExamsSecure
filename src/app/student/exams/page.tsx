import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function StudentExamsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/unauthorized");
  }

  const assignments = await prisma.examAssignment.findMany({
    where: { studentId: session.user.id },
    orderBy: { exam: { windowStart: "asc" } },
    select: {
      exam: {
        select: {
          id: true,
          title: true,
          durationMinutes: true,
          windowStart: true,
          windowEnd: true,
          status: true,
          course: { select: { name: true } },
          _count: { select: { questions: true } },
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-50">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Student workspace</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Assigned exams</h1>
        <p className="mt-3 text-slate-400">Exams assigned to your account are listed below.</p>
        <section className="mt-10 space-y-3" aria-label="Assigned exams">
          {assignments.length ? assignments.map(({ exam }) => <article key={exam.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5"><h2 className="font-semibold">{exam.title}</h2><p className="mt-1 text-sm text-slate-400">{exam.course.name} · {exam._count.questions} questions · {exam.durationMinutes} minutes</p><p className="mt-2 text-xs uppercase tracking-wide text-emerald-400">{exam.status} · {exam.windowStart.toLocaleString()} to {exam.windowEnd.toLocaleString()}</p><Link href={`/student/exams/${exam.id}` as Route} className="mt-4 inline-block text-sm text-emerald-400">Open exam</Link></article>) : <p className="rounded-xl border border-dashed border-slate-800 p-5 text-sm text-slate-400">No exams have been assigned to you yet.</p>}
        </section>
      </div>
    </main>
  );
}
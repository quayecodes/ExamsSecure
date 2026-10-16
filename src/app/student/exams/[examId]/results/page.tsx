import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function StudentResultPage({ params }: { params: { examId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "STUDENT") redirect("/unauthorized");

  const assignment = await prisma.examAssignment.findUnique({
    where: { examId_studentId: { examId: params.examId, studentId: session.user.id } },
    select: { exam: { select: { title: true, course: { select: { name: true } } } } },
  });
  const attempt = await prisma.examAttempt.findUnique({
    where: { examId_studentId: { examId: params.examId, studentId: session.user.id } },
    select: { score: true, status: true, submittedAt: true },
  });

  if (!assignment) redirect("/student/exams");

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-50">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Student results</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">{assignment.exam.title}</h1>
        <p className="mt-3 text-slate-400">{assignment.exam.course.name}</p>
        {attempt?.status !== "IN_PROGRESS" && attempt ? <div className="mt-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8"><p className="text-sm uppercase tracking-wide text-emerald-300">{attempt.status.replace("_", " ")}</p><p className="mt-3 text-5xl font-bold">{attempt.score?.toString() ?? "0"}</p><p className="mt-2 text-slate-300">points awarded</p></div> : <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-8"><p className="text-slate-300">Your result is not available yet. Submit your attempt before viewing results.</p></div>}
      </div>
    </main>
  );
}
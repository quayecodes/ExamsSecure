import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function LecturerResultsPage({ params }: { params: { examId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "LECTURER") redirect("/unauthorized");

  const exam = await prisma.exam.findFirst({
    where: { id: params.examId, course: { lecturerId: session.user.id } },
    select: {
      title: true,
      course: { select: { name: true } },
      attempts: { orderBy: { submittedAt: "asc" }, select: { id: true, score: true, status: true, submittedAt: true, student: { select: { fullName: true, email: true } }, _count: { select: { integrityEvents: true } } } },
    },
  });

  if (!exam) redirect("/lecturer/exams");

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-50">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Lecturer results</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">{exam.title}</h1>
        <p className="mt-3 text-slate-400">{exam.course.name}</p>
        <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900"><table className="w-full text-left text-sm"><thead className="border-b border-slate-800 text-slate-400"><tr><th className="px-5 py-4">Student</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Score</th><th className="px-5 py-4">Integrity events</th><th className="px-5 py-4">Submitted</th></tr></thead><tbody>{exam.attempts.length ? exam.attempts.map((attempt) => <tr key={attempt.id} className="border-b border-slate-800 last:border-0"><td className="px-5 py-4"><span className="block font-medium">{attempt.student.fullName}</span><span className="text-slate-400">{attempt.student.email}</span></td><td className="px-5 py-4 text-emerald-300">{attempt.status}</td><td className="px-5 py-4">{attempt.score?.toString() ?? "-"}</td><td className="px-5 py-4">{attempt._count.integrityEvents}</td><td className="px-5 py-4 text-slate-400">{attempt.submittedAt?.toLocaleString() ?? "-"}</td></tr>) : <tr><td colSpan={5} className="px-5 py-8 text-slate-400">No attempts have been submitted.</td></tr>}</tbody></table></div>
      </div>
    </main>
  );
}
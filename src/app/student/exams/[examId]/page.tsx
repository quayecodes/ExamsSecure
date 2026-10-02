import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import StudentExam from "./StudentExam";

export default async function StudentExamPage({ params }: { params: { examId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/unauthorized");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-50">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Student workspace</p>
        <div className="mt-3"><StudentExam examId={params.examId} /></div>
      </div>
    </main>
  );
}
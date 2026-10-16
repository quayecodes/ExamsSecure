import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import WorkspaceShell from "@/components/WorkspaceShell";
import ExamManager from "./ExamManager";

export default async function LecturerExamsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "LECTURER") {
    redirect("/unauthorized");
  }

  return <WorkspaceShell role="LECTURER">
    <main className="px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Lecturer workspace</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Exams</h1>
        <p className="mt-3 max-w-2xl text-slate-400">Create draft exams from questions in the courses you teach.</p>
        <div className="mt-10"><ExamManager /></div>
      </div>
    </main>
  </WorkspaceShell>;
}
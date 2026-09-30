import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import QuestionBankManager from "./QuestionBankManager";

export default async function LecturerQuestionBanksPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "LECTURER") {
    redirect("/unauthorized");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-50">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Lecturer workspace</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Question banks</h1>
        <p className="mt-3 max-w-2xl text-slate-400">Create and organize reusable question collections for the courses you teach.</p>
        <div className="mt-10"><QuestionBankManager /></div>
      </div>
    </main>
  );
}
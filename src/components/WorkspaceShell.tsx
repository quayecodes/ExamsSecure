import Link from "next/link";
import SignOutButton from "./SignOutButton";

type WorkspaceRole = "LECTURER" | "STUDENT";

const navigation = {
  LECTURER: [
    { href: "/lecturer/exams", label: "Exams" },
    { href: "/lecturer/question-banks", label: "Question banks" },
  ],
  STUDENT: [
    { href: "/student/exams", label: "Assigned exams" },
  ],
} as const;

export default function WorkspaceShell({ role, children }: { role: WorkspaceRole; children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-slate-50">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href={role === "LECTURER" ? "/lecturer/exams" : "/student/exams"} className="text-lg font-bold tracking-tight text-white">Exam<span className="text-emerald-400">Secure</span></Link>
          <nav aria-label="Workspace navigation" className="order-3 flex w-full gap-2 overflow-x-auto sm:order-none sm:w-auto">
            {navigation[role].map((item) => <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-50">{item.label}</Link>)}
          </nav>
          <SignOutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
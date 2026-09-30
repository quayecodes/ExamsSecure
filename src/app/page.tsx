export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-slate-50">
      <div className="max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/80 p-10 shadow-2xl shadow-slate-950/40">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
          Phase 4
        </p>
        <h1 className="text-4xl font-bold tracking-tight">ExamSecure</h1>
        <p className="mt-4 text-lg text-slate-300">
          Project scaffolding is in place. The foundation is ready for authentication, assessment workflows,
          and secure exam management.
        </p>
      </div>
    </main>
  );
}

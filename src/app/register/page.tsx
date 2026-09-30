"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });

    if (!response.ok) {
      const result = await response.json();
      setError(result.error ?? "Unable to create this account.");
      setIsSubmitting(false);
      return;
    }

    router.push("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <div><p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">ExamSecure</p><h1 className="mt-3 text-3xl font-bold">Create student account</h1></div>
        <label className="block text-sm">Full name<input name="fullName" required minLength={2} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
        <label className="block text-sm">Email<input name="email" type="email" required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
        <label className="block text-sm">Institution<input name="institutionName" required minLength={2} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
        <label className="block text-sm">Password<input name="password" type="password" required minLength={8} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button disabled={isSubmitting} className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">{isSubmitting ? "Creating account..." : "Create account"}</button>
        <p className="text-sm text-slate-400">Already registered? <Link href="/login" className="text-emerald-400">Sign in</Link></p>
      </form>
    </main>
  );
}
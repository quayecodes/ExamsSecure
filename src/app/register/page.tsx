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
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-slate-50 sm:px-6">
      <form onSubmit={handleSubmit} aria-labelledby="register-heading" className="w-full max-w-md space-y-5 rounded-2xl border border-slate-800/90 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/30 sm:p-8">
        <div className="border-b border-slate-800 pb-5"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">ExamSecure</p><h1 id="register-heading" className="mt-3 text-3xl font-bold tracking-tight">Create student account</h1><p className="mt-2 text-sm text-slate-400">Join your institution&apos;s secure examination space.</p></div>
        <div><label htmlFor="register-name" className="block text-sm font-medium text-slate-200">Full name</label><input id="register-name" name="fullName" autoComplete="name" required minLength={2} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5" /></div>
        <div><label htmlFor="register-email" className="block text-sm font-medium text-slate-200">Email</label><input id="register-email" name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5" /></div>
        <div><label htmlFor="register-institution" className="block text-sm font-medium text-slate-200">Institution</label><input id="register-institution" name="institutionName" autoComplete="organization" required minLength={2} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5" /></div>
        <div><label htmlFor="register-password" className="block text-sm font-medium text-slate-200">Password</label><input id="register-password" name="password" type="password" autoComplete="new-password" required minLength={8} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5" /></div>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Creating account..." : "Create account"}</button>
        <p className="text-sm text-slate-400">Already registered? <Link href="/login" className="font-medium text-emerald-400 underline-offset-4 hover:underline">Sign in</Link></p>
      </form>
    </main>
  );
}
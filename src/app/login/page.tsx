"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setIsSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-slate-50 sm:px-6">
      <form onSubmit={handleSubmit} aria-labelledby="login-heading" className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800/90 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/30 sm:p-8">
        <div className="border-b border-slate-800 pb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">ExamSecure</p>
          <h1 id="login-heading" className="mt-3 text-3xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-slate-400">Access your examination workspace.</p>
        </div>
        <div className="space-y-5">
          <div><label htmlFor="login-email" className="block text-sm font-medium text-slate-200">Email</label><input id="login-email" name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-50 placeholder:text-slate-600" /></div>
          <div><label htmlFor="login-password" className="block text-sm font-medium text-slate-200">Password</label><input id="login-password" name="password" type="password" autoComplete="current-password" required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-50 placeholder:text-slate-600" /></div>
        </div>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Signing in..." : "Sign in"}</button>
        <p className="text-sm text-slate-400">New student? <Link href="/register" className="font-medium text-emerald-400 underline-offset-4 hover:underline">Create an account</Link></p>
      </form>
    </main>
  );
}
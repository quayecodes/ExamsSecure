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
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">ExamSecure</p>
          <h1 className="mt-3 text-3xl font-bold">Sign in</h1>
        </div>
        <label className="block text-sm">Email<input name="email" type="email" required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
        <label className="block text-sm">Password<input name="password" type="password" required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button disabled={isSubmitting} className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">{isSubmitting ? "Signing in..." : "Sign in"}</button>
        <p className="text-sm text-slate-400">New student? <Link href="/register" className="text-emerald-400">Create an account</Link></p>
      </form>
    </main>
  );
}
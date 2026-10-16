"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:border-emerald-400 hover:text-emerald-300">Sign out</button>;
}
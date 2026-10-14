"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function UnavailablePage() {
  const pathname = usePathname();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">TaskAnt</p>
      <h1 className="mt-3 text-3xl font-bold text-gray-900">This page is not available yet</h1>
      <p className="mt-3 max-w-lg text-gray-600">
        The screen for <code className="rounded bg-gray-100 px-1.5 py-0.5">{pathname}</code> has not
        been implemented in this project yet.
      </p>
      <Link href="/" className="mt-6 font-medium text-brand-600 hover:underline">
        Return to the home page
      </Link>
    </main>
  );
}

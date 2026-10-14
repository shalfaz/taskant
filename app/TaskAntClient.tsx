"use client";

import dynamic from "next/dynamic";

const TaskAntApp = dynamic(() => import("../client/src/App"), {
  ssr: false,
  loading: () => (
    <main className="flex min-h-screen items-center justify-center text-gray-600">
      Loading TaskAnt...
    </main>
  ),
});

export default function TaskAntClient() {
  return <TaskAntApp />;
}

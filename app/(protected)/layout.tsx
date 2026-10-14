"use client";

import type { ReactNode } from "react";
import DashboardLayout from "../../client/src/layouts/DashboardLayout";
import { ProtectedRoute } from "../../client/src/components/ProtectedRoute";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

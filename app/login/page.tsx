"use client";

import { GuestRoute } from "../../client/src/components/ProtectedRoute";
import LoginPage from "../../client/src/pages/LoginPage";

export default function Page() {
  return (
    <GuestRoute>
      <LoginPage />
    </GuestRoute>
  );
}

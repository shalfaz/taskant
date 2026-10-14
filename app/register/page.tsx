"use client";

import { GuestRoute } from "../../client/src/components/ProtectedRoute";
import RegisterPage from "../../client/src/pages/RegisterPage";

export default function Page() {
  return (
    <GuestRoute>
      <RegisterPage />
    </GuestRoute>
  );
}

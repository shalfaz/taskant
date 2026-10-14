"use client";

import { AdminRoute } from "../../../client/src/components/ProtectedRoute";

function AdminDashboardPlaceholder() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8">
      <h2 className="text-xl font-semibold text-gray-900">Admin tools are not available yet</h2>
      <p className="mt-2 text-gray-600">
        The backend includes admin endpoints, but the admin screens have not been built.
      </p>
    </div>
  );
}

export default function Page() {
  return (
    <AdminRoute>
      <AdminDashboardPlaceholder />
    </AdminRoute>
  );
}

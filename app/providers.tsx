"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../client/src/contexts/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const handleUnauthorized = () => router.replace("/login");
    window.addEventListener("taskant:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("taskant:unauthorized", handleUnauthorized);
  }, [router]);

  return (
    <AuthProvider>
      <Toaster position="top-right" />
      {children}
    </AuthProvider>
  );
}

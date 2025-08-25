"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Use replace instead of push for smoother transition
      router.replace("/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  return (
    <ProtectedRoute>
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <Spinner size="lg" />
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    </ProtectedRoute>
  );
}

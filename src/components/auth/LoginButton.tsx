"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";

export const LoginButton: React.FC = () => {
  const { login, loading } = useAuth();

  const MicrosoftIcon = () => (
    <svg width="18" height="18" viewBox="0 0 23 23" fill="currentColor">
      <path d="M1 1h10v10H1z" fill="#F25022" />
      <path d="M12 1h10v10H12z" fill="#7FBA00" />
      <path d="M1 12h10v10H1z" fill="#00A4EF" />
      <path d="M12 12h10v10H12z" fill="#FFB900" />
    </svg>
  );

  return (
    <Button
      size="lg"
      onClick={login}
      disabled={loading}
      className="w-full h-14 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-none text-white text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-3"
    >
      {loading ? (
        <>
          <Spinner size="sm" className="border-white/30 border-t-white" />
          Signing in...
        </>
      ) : (
        <>
          <MicrosoftIcon />
          Sign in with Microsoft
        </>
      )}
    </Button>
  );
};

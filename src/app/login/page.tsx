"use client";

import React, { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { User, Shield, Users } from "lucide-react";
import { LoginButton } from "@/components/auth/LoginButton";
import { AuthLoadingScreen } from "@/components/loading/AuthLoadingScreen";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";


export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <AuthLoadingScreen 
        message="Loading..."
        description="Checking authentication status"
      />
    );
  }

  // Don't render login page if already authenticated (prevents flash)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div className="w-full min-h-screen flex items-center">
        <div className="flex flex-col justify-center p-10 text-white lg:w-1/2 w-full">
          <div className="max-w-[500px]">
            <h1 className="text-white text-[3.5rem] font-bold mb-6 drop-shadow-sm">
              Recruitment
            </h1>
            <h2 className="text-white/90 text-[2.2rem] font-light mb-8">
              Management System
            </h2>
            <p className="text-white/80 text-xl mb-10 leading-relaxed">
              Streamline your hiring process with our comprehensive recruitment platform. Manage
              candidates, track applications, and make better hiring decisions.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <User className="w-6 h-6 text-white/80" />
                <span className="text-white/80 text-base">
                  Candidate Management
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Shield className="w-6 h-6 text-white/80" />
                <span className="text-white/80 text-base">
                  Secure Microsoft Authentication
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Users className="w-6 h-6 text-white/80" />
                <span className="text-white/80 text-base">
                  Team Collaboration
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center p-10 lg:w-1/2 w-full">
          <Card className="max-w-[450px] w-full bg-white/95 backdrop-blur-sm border-none rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
            <CardContent className="p-10">
            <div className="space-y-6 w-full text-center">
              <div>
                <div className="w-20 h-20 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_8px_16px_rgba(102,126,234,0.3)]">
                  <User className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-[#2c3e50] mb-2 font-semibold text-2xl">
                  Welcome Back
                </h2>
                <p className="text-[#7f8c8d] text-base mb-8">
                  Sign in with your Microsoft account to access your recruitment dashboard
                </p>
              </div>

              <LoginButton />

              <div className="mt-6">
                <span className="text-[#95a5a6] text-sm">
                  Secured by Microsoft Azure Active Directory
                </span>
              </div>
            </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

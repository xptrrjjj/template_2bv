"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface WelcomeSectionProps {
  userName?: string;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ userName }) => {
  const firstName = userName?.split(" ")[0] || "User";

  return (
    <Card className="bg-white border border-slate-200 rounded-2xl mb-8 shadow-sm">
      <CardContent className="p-10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="text-slate-500 text-base">
              Your admin dashboard is ready to use. Navigate using the sidebar to manage users, roles, and system settings.
            </p>
          </div>
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
            <Trophy className="w-10 h-10 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

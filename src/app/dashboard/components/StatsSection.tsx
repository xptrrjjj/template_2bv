"use client";

import React from "react";
import {
  User,
  Plus,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { StatCard } from "./StatCard";

interface StatsSectionProps {
  stats?: {
    activeCandidates: number;
    openPositions: number;
    interviewsThisWeek: number;
    successfulHires: number;
  };
}

export const StatsSection: React.FC<StatsSectionProps> = ({ stats }) => {
  const defaultStats = {
    activeCandidates: 47,
    openPositions: 8,
    interviewsThisWeek: 12,
    successfulHires: 3,
  };

  const currentStats = stats || defaultStats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Active Candidates"
        value={currentStats.activeCandidates}
        icon={<User />}
        color="#667eea"
        trend={12}
      />
      <StatCard
        title="Open Positions"
        value={currentStats.openPositions}
        icon={<Plus />}
        color="#52c41a"
        trend={25}
      />
      <StatCard
        title="Interviews This Week"
        value={currentStats.interviewsThisWeek}
        icon={<Calendar />}
        color="#fa8c16"
        trend={8}
      />
      <StatCard
        title="Successful Hires"
        value={currentStats.successfulHires}
        icon={<CheckCircle />}
        color="#722ed1"
        trend={50}
      />
    </div>
  );
};

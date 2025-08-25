"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";


interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend }) => {
  return (
    <Card className="bg-white border-slate-200 rounded-xl relative shadow-sm">
      <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{
            backgroundColor: `${color}15`,
            color: color,
          }}
        >
          {icon}
        </div>
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <p className="text-slate-800 text-[28px] font-bold">{value.toLocaleString()}</p>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <TrendingUp className="text-emerald-500 w-3.5 h-3.5" />
          <span className="text-emerald-500 text-xs font-medium">
            +{trend}% from last week
          </span>
        </div>
      )}
      </CardContent>
    </Card>
  );
};

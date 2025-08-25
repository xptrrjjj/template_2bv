"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";
import { SystemHealthCheck } from "@/types/rbac";

interface SystemStatsProps {
  health: SystemHealthCheck | null;
}

export function SystemStats({ health }: SystemStatsProps) {
  if (!health) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-500" />
          System Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{health.userCount}</div>
            <div className="text-sm text-slate-600">Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{health.roleCount}</div>
            <div className="text-sm text-slate-600">Roles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{health.permissionCount}</div>
            <div className="text-sm text-slate-600">Permissions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{health.applicationCount}</div>
            <div className="text-sm text-slate-600">Applications</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
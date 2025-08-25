"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RotateCw } from "lucide-react";

interface BootstrapProgress {
  applications: { created: number; total: number };
  permissions: { created: number; total: number };
  roles: { created: number; total: number };
  superAdmins: { assigned: number; total: number };
}

interface BootstrapStatusProps {
  progress: BootstrapProgress | null;
}

export function BootstrapStatus({ progress }: BootstrapStatusProps) {
  const getProgressPercentage = (created: number, total: number) => {
    return total > 0 ? Math.round((created / total) * 100) : 0;
  };

  if (!progress) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCw className="h-5 w-5 text-green-500" />
          Bootstrap Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Applications</span>
              <span>{progress.applications.created}/{progress.applications.total}</span>
            </div>
            <Progress value={getProgressPercentage(
              progress.applications.created,
              progress.applications.total
            )} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Permissions</span>
              <span>{progress.permissions.created}/{progress.permissions.total}</span>
            </div>
            <Progress value={getProgressPercentage(
              progress.permissions.created,
              progress.permissions.total
            )} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Roles</span>
              <span>{progress.roles.created}/{progress.roles.total}</span>
            </div>
            <Progress value={getProgressPercentage(
              progress.roles.created,
              progress.roles.total
            )} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Super Admins</span>
              <span>{progress.superAdmins.assigned}/{progress.superAdmins.total}</span>
            </div>
            <Progress value={getProgressPercentage(
              progress.superAdmins.assigned,
              progress.superAdmins.total
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
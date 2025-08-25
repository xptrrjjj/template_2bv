"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PermissionRecord } from "@/types/rbac";

interface PermissionWithDetails extends PermissionRecord {
  roleCount: number;
  canDelete: boolean;
}

interface PermissionStatsProps {
  permissions: PermissionWithDetails[];
}

export function PermissionStats({ permissions }: PermissionStatsProps) {
  const systemPermissions = permissions.filter(p => p.is_system_permission);
  const customPermissions = permissions.filter(p => !p.is_system_permission);
  const deletablePermissions = permissions.filter(p => p.canDelete);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Total Permissions</p>
          <div className="text-2xl font-bold text-blue-600">
            {permissions.length}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">System Permissions</p>
          <div className="text-2xl font-bold text-purple-600">
            {systemPermissions.length}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Custom Permissions</p>
          <div className="text-2xl font-bold text-green-600">
            {customPermissions.length}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Deletable</p>
          <div className="text-2xl font-bold text-orange-600">
            {deletablePermissions.length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
"use client";

import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";
import { PermissionGuard } from "@/components/guards";

interface RoleHeaderProps {
  onRefresh: () => void;
  onCreateRole: () => void;
  loading?: boolean;
}

export function RoleHeader({ onRefresh, onCreateRole, loading = false }: RoleHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl">Role Management</CardTitle>
            <p className="text-muted-foreground mt-1">
              Create and manage system roles and permissions
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <PermissionGuard resource="roles" action="write" showFallback={false}>
              <Button onClick={onCreateRole}>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </PermissionGuard>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
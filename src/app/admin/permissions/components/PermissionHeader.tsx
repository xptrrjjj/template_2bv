"use client";

import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, RefreshCw, Plus, Search } from "lucide-react";
import { PermissionGuard } from "@/components/guards";

interface PermissionHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onCreatePermission: () => void;
  loading?: boolean;
}

export function PermissionHeader({
  searchTerm,
  onSearchChange,
  onRefresh,
  onCreatePermission,
  loading = false,
}: PermissionHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Permissions Management
            </CardTitle>
            <p className="text-muted-foreground mt-1">
              Manage system and custom permissions
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
            <PermissionGuard
              resource="rbac.permissions"
              action="create"
              fallback={null}
            >
              <Button onClick={onCreatePermission}>
                <Plus className="h-4 w-4 mr-2" />
                Create Permission
              </Button>
            </PermissionGuard>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
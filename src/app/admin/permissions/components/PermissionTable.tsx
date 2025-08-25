"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  Trash2,
  Globe,
  AppWindow,
  Lock,
} from "lucide-react";
import { PermissionRecord } from "@/types/rbac";

interface PermissionWithDetails extends PermissionRecord {
  roleCount: number;
  canDelete: boolean;
}

interface PermissionTableProps {
  permissions: PermissionWithDetails[];
  loading: boolean;
  onViewPermission: (permission: PermissionWithDetails) => void;
  onDeletePermission: (permissionId: string) => void;
}

export function PermissionTable({ 
  permissions, 
  loading, 
  onViewPermission, 
  onDeletePermission 
}: PermissionTableProps) {
  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="text-center py-8">
          Loading permissions...
        </TableCell>
      </TableRow>
    );
  }

  if (permissions.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
          No permissions found
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {permissions.map((permission) => (
        <TableRow key={permission.permission_id}>
          <TableCell>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-muted px-1 rounded">{permission.permission_id}</code>
              {permission.is_system_permission && (
                <Badge variant="secondary" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  System
                </Badge>
              )}
            </div>
          </TableCell>
          <TableCell className="font-medium">{permission.name}</TableCell>
          <TableCell>
            <Badge variant="outline" className="bg-cyan-50">{permission.resource}</Badge>
          </TableCell>
          <TableCell>
            <Badge variant="outline" className="bg-orange-50">{permission.action}</Badge>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Badge 
                variant={permission.scope === "global" ? "secondary" : "default"}
                className="flex items-center gap-1"
              >
                {permission.scope === "global" ? <Globe className="h-3 w-3" /> : <AppWindow className="h-3 w-3" />}
                {permission.scope}
              </Badge>
              {permission.scope === "app" && permission.app_id && (
                <span className="text-sm text-muted-foreground">({permission.app_id})</span>
              )}
            </div>
          </TableCell>
          <TableCell>
            <Badge variant={permission.roleCount > 0 ? "default" : "secondary"}>
              {permission.roleCount} role{permission.roleCount !== 1 ? "s" : ""}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewPermission(permission)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {permission.canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${permission.name}"?`)) {
                      onDeletePermission(permission.permission_id);
                    }
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
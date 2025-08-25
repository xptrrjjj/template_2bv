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
  Edit,
  Trash2,
  Eye,
  Globe,
  AppWindow,
} from "lucide-react";
import { PermissionGuard } from "@/components/guards";
import { RoleRecord, PermissionRecord } from "@/types/rbac";

interface RoleWithDetails extends RoleRecord {
  permissionNames: string[];
  userCount: number;
}

interface RoleTableProps {
  roles: RoleWithDetails[];
  loading: boolean;
  onViewRole: (role: RoleWithDetails) => void;
  onEditRole: (role: RoleWithDetails) => void;
  onDeleteRole: (role: RoleWithDetails) => void;
}

export function RoleTable({ 
  roles, 
  loading, 
  onViewRole, 
  onEditRole, 
  onDeleteRole 
}: RoleTableProps) {
  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="text-center py-8">
          Loading roles...
        </TableCell>
      </TableRow>
    );
  }

  if (roles.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
          No roles found
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {roles.map((role) => (
        <TableRow key={role.role_id}>
          <TableCell>
            <div className="space-y-2">
              <div>
                <div className="font-medium">{role.name}</div>
                <div className="flex gap-2 mt-1">
                  <Badge 
                    variant={role.scope === "global" ? "secondary" : "default"}
                    className="flex items-center gap-1"
                  >
                    {role.scope === "global" ? <Globe className="h-3 w-3" /> : <AppWindow className="h-3 w-3" />}
                    {role.scope === "global" ? "Global" : `App: ${role.app_id}`}
                  </Badge>
                  {role.is_system_role && (
                    <Badge variant="outline" className="bg-orange-50">System</Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {role.description}
              </p>
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-600">
                  {role.permission_ids.length}
                </span>
                <span className="text-xs text-muted-foreground">
                  {role.permission_ids.length === 1 ? 'permission' : 'permissions'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 max-w-48">
                {role.permissionNames.slice(0, 2).map((name) => (
                  <Badge key={name} variant="outline" className="text-xs">
                    {name.length > 15 ? `${name.substring(0, 15)}...` : name}
                  </Badge>
                ))}
                {role.permissionNames.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{role.permissionNames.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${role.userCount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {role.userCount}
              </span>
              <span className="text-xs text-muted-foreground">
                {role.userCount === 1 ? 'user' : 'users'}
              </span>
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              <div className="text-sm">
                {new Date(role.created_at).toLocaleDateString()}
              </div>
              <div className="text-xs text-muted-foreground">
                by {role.created_by.split('@')[0] || 'System'}
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewRole(role)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <PermissionGuard resource="roles" action="write" showFallback={false}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditRole(role)}
                  disabled={role.is_system_role}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </PermissionGuard>
              <PermissionGuard resource="roles" action="delete" showFallback={false}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this role?")) {
                      onDeleteRole(role);
                    }
                  }}
                  disabled={role.is_system_role}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </PermissionGuard>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
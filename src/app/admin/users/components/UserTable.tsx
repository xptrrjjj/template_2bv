"use client";

import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  Edit,
  Trash2,
  Crown,
  RefreshCw,
} from "lucide-react";
import { PermissionGuard } from "@/components/guards";
import { UserRecord } from "@/types/rbac";

interface UserWithRoles extends UserRecord {
  roleNames: string[];
}

interface UserTableProps {
  users: UserWithRoles[];
  loading: boolean;
  onEditUser: (user: UserWithRoles) => void;
  onDeleteUser: (user: UserWithRoles) => void;
}

export function UserTable({ users, loading, onEditUser, onDeleteUser }: UserTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Roles</TableHead>
          <TableHead>Last Login</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.microsoft_oid}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.profile_picture} alt={user.name} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.name}</span>
                    {user.is_super_admin && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Tag
                variant={
                  user.status === "active"
                    ? "success"
                    : user.status === "inactive"
                    ? "warning"
                    : "destructive"
                }
              >
                {user.status.toUpperCase()}
              </Tag>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {user.roleNames.map((roleName) => (
                  <Badge key={roleName} variant="secondary">
                    {roleName}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>
              {new Date(user.last_login).toLocaleString()}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <PermissionGuard resource="users" action="write" showFallback={false}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditUser(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </PermissionGuard>
                <PermissionGuard resource="users" action="delete" showFallback={false}>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={user.is_super_admin}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this user? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteUser(user)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </PermissionGuard>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
"use client";

import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  User,
  Shield,
  Grid3X3,
  Key,
  Trophy,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/services/api";


interface AdminStats {
  userCount: number;
  roleCount: number;
  permissionCount: number;
  applicationCount: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    userCount: 0,
    roleCount: 0,
    permissionCount: 0,
    applicationCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [users, roles, permissions, applications] = await Promise.all([
          apiClient.getAllUsers(),
          apiClient.getAllRoles(),
          apiClient.getAllPermissions(),
          apiClient.getAllApplications(),
        ]);

        setStats({
          userCount: users.length,
          roleCount: roles.length,
          permissionCount: permissions.length,
          applicationCount: applications.length,
        });
      } catch (error) {
        console.error("Failed to load admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <Card className="bg-white border-slate-200 rounded-2xl mb-8 shadow-sm">
          <CardContent className="p-8">
            <div className="flex items-center gap-4">
              <div className="w-15 h-15 bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(114,46,209,0.3)]">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 m-0">
                  System Administration
                </h2>
                <p className="text-base text-slate-500">
                  Manage users, roles, permissions, and system settings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white rounded-xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Users</p>
                  {loading ? (
                    <Skeleton className="w-16 h-8 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-800">{stats.userCount}</p>
                  )}
                </div>
                <User className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">System Roles</p>
                  {loading ? (
                    <Skeleton className="w-16 h-8 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-800">{stats.roleCount}</p>
                  )}
                </div>
                <Shield className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Permissions</p>
                  {loading ? (
                    <Skeleton className="w-16 h-8 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-800">{stats.permissionCount}</p>
                  )}
                </div>
                <Key className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Applications</p>
                  {loading ? (
                    <Skeleton className="w-16 h-8 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-800">{stats.applicationCount}</p>
                  )}
                </div>
                <Grid3X3 className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card 
            className="bg-white rounded-xl border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push("/admin/users")}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">User Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-slate-600">
                Manage user accounts, assign roles, and control access permissions across
                applications.
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-white rounded-xl border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push("/admin/roles")}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="font-semibold">Role Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-slate-600">
                Create and manage roles, assign permissions, and define access levels for different
                user types.
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-white rounded-xl border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push("/admin/permissions")}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">Permission Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-slate-600">
                Create custom permissions, manage system permissions, and control granular access
                rights.
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-white rounded-xl border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push("/admin/system")}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-purple-500" />
                <span className="font-semibold">System Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-slate-600">
                Configure system-wide settings, manage applications, and monitor system health.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

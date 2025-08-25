"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { UserSearch } from "./UserSearch";

interface UserHeaderProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function UserHeader({ 
  searchText, 
  onSearchChange, 
  onRefresh, 
  loading = false 
}: UserHeaderProps) {
  return (
    <Card className="p-8 mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            User Management
          </h1>
          <p className="text-slate-600">
            Manage user accounts and permissions
          </p>
        </div>
        <UserSearch
          searchText={searchText}
          onSearchChange={onSearchChange}
          onRefresh={onRefresh}
          loading={loading}
        />
      </div>
    </Card>
  );
}
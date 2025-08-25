"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";

interface UserSearchProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function UserSearch({ 
  searchText, 
  onSearchChange, 
  onRefresh, 
  loading = false 
}: UserSearchProps) {
  return (
    <div className="flex gap-4 items-center">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search users..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 w-72"
        />
      </div>
      <Button
        onClick={onRefresh}
        disabled={loading}
        variant="outline"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </div>
  );
}
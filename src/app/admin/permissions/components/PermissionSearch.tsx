"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface PermissionSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function PermissionSearch({ searchTerm, onSearchChange }: PermissionSearchProps) {
  return (
    <div className="relative max-w-md">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search permissions by name, ID, resource, or action..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
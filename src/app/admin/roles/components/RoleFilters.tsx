"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface RoleFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  scopeFilter: 'all' | 'global' | 'app';
  onScopeFilterChange: (value: 'all' | 'global' | 'app') => void;
  systemFilter: 'all' | 'system' | 'custom';
  onSystemFilterChange: (value: 'all' | 'system' | 'custom') => void;
  totalRoles: number;
  filteredCount: number;
  onClearFilters: () => void;
}

export function RoleFilters({
  searchTerm,
  onSearchChange,
  scopeFilter,
  onScopeFilterChange,
  systemFilter,
  onSystemFilterChange,
  totalRoles,
  filteredCount,
  onClearFilters,
}: RoleFiltersProps) {
  const hasFilters = searchTerm || scopeFilter !== 'all' || systemFilter !== 'all';

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
      <div className="flex-1 relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search roles by name, description, ID, or permissions..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="flex gap-4">
        <div className="min-w-32">
          <p className="text-xs text-muted-foreground mb-2">Scope</p>
          <Select value={scopeFilter} onValueChange={onScopeFilterChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scopes</SelectItem>
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value="app">Application</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="min-w-32">
          <p className="text-xs text-muted-foreground mb-2">Type</p>
          <Select value={systemFilter} onValueChange={onSystemFilterChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-xs text-muted-foreground">
          Showing {filteredCount} of {totalRoles} roles
        </p>
        {hasFilters && (
          <Button 
            variant="link" 
            size="sm" 
            className="p-0 h-auto mt-1"
            onClick={onClearFilters}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
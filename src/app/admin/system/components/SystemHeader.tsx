"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface SystemHeaderProps {
  onRefresh: () => void;
  loading?: boolean;
}

export function SystemHeader({ onRefresh, loading = false }: SystemHeaderProps) {
  return (
    <Card className="p-8 mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            System Administration
          </h1>
          <p className="text-slate-600">
            Manage system-wide settings and monitoring
          </p>
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
    </Card>
  );
}
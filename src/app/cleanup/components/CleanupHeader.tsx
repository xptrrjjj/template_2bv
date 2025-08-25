"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Trash2, Search, AlertTriangle } from "lucide-react";

interface CleanupHeaderProps {
  onAnalyze: () => void;
  onCleanup: () => void;
  loading: boolean;
  canCleanup: boolean;
  duplicateCount: number;
}

export function CleanupHeader({
  onAnalyze,
  onCleanup,
  loading,
  canCleanup,
  duplicateCount,
}: CleanupHeaderProps) {
  return (
    <Card className="bg-white border border-slate-200 rounded-2xl mb-6 shadow-sm p-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Trash2 className="text-red-500 mr-3 w-6 h-6" />
        Datastore Cleanup Utility
      </h2>
      
      <Alert className="mb-6 border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4" />
        <div>
          <div className="font-medium">Warning: Data Cleanup Tool</div>
          <AlertDescription>
            This tool identifies and removes duplicate company records from the datastore. Always analyze first before cleaning up. Deleted records cannot be recovered.
          </AlertDescription>
        </div>
      </Alert>

      <div className="flex gap-4 items-center">
        <Button 
          onClick={onAnalyze}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          {loading ? 'Analyzing...' : 'Analyze Duplicates'}
        </Button>
        
        {canCleanup && (
          <Button 
            variant="destructive"
            onClick={onCleanup}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {loading ? 'Cleaning...' : `Clean Up Duplicates (${duplicateCount})`}
          </Button>
        )}
      </div>
    </Card>
  );
}
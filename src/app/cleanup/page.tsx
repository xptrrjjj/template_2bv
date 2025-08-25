'use client';

import React from 'react';
import {
  CleanupHeader,
  AnalysisResults,
  CleanupResults,
  LoadingSpinner,
  ErrorDisplay,
  useCleanupManagement,
} from './components';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

export default function CleanupPage() {
  const {
    loading,
    analysis,
    cleanupResult,
    error,
    showConfirmDialog,
    analyzeData,
    performCleanup,
    handleConfirmCleanup,
    handleCancelCleanup,
  } = useCleanupManagement();

  return (
    <div style={{ padding: '32px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <CleanupHeader
          onAnalyze={analyzeData}
          onCleanup={performCleanup}
          loading={loading}
          canCleanup={(analysis?.summary.duplicateGroupsFound ?? 0) > 0}
          duplicateCount={analysis?.summary.recordsToDelete || 0}
        />

        <ErrorDisplay error={error} />

        <LoadingSpinner loading={loading} />

        {analysis && (
          <AnalysisResults analysis={analysis} />
        )}

        {cleanupResult && (
          <CleanupResults cleanupResult={cleanupResult} />
        )}

        <AlertDialog open={showConfirmDialog} onOpenChange={handleCancelCleanup}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Confirm Duplicate Cleanup
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>
                    This will permanently delete <strong>{analysis?.summary.recordsToDelete}</strong> duplicate records.
                  </p>
                  <div className="text-sm">
                    <p>• <strong>{analysis?.summary.recordsToKeep}</strong> records will be kept</p>
                    <p>• <strong>{analysis?.summary.duplicateGroupsFound}</strong> companies have duplicates</p>
                  </div>
                  <p className="text-amber-600 font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    This action cannot be undone!
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelCleanup}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmCleanup}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Duplicates
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
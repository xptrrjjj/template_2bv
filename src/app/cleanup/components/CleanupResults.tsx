"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

interface CleanupResult {
  status: string;
  action: string;
  message: string;
  summary: {
    totalRecords: number;
    duplicateGroupsProcessed: number;
    recordsDeleted: number;
    recordsKept: number;
    deletionsFailed: number;
  };
  results: {
    company_name: string;
    deleted_record_id: string;
    deleted_created_at: string;
    status: string;
    error?: string;
  }[];
}

interface CleanupResultsProps {
  cleanupResult: CleanupResult;
}

export function CleanupResults({ cleanupResult }: CleanupResultsProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cleanup Results</CardTitle>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="w-4 h-4 mr-1" /> Completed
        </Badge>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <div>
            <div className="font-medium">Cleanup Successful</div>
            <AlertDescription>{cleanupResult.message}</AlertDescription>
          </div>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h3 className="text-2xl font-bold text-green-600 mb-1">
              {cleanupResult.summary.recordsDeleted}
            </h3>
            <p className="text-sm text-gray-600">Records Deleted</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h3 className="text-2xl font-bold text-blue-600 mb-1">
              {cleanupResult.summary.recordsKept}
            </h3>
            <p className="text-sm text-gray-600">Records Kept</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-2xl font-bold text-yellow-600 mb-1">
              {cleanupResult.summary.duplicateGroupsProcessed}
            </h3>
            <p className="text-sm text-gray-600">Companies Processed</p>
          </div>
          {cleanupResult.summary.deletionsFailed > 0 && (
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <h3 className="text-2xl font-bold text-red-600 mb-1">
                {cleanupResult.summary.deletionsFailed}
              </h3>
              <p className="text-sm text-gray-600">Failed Deletions</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
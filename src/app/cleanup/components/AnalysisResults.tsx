"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

interface DuplicateGroup {
  teamtailor_option_id: string;
  company_name: string;
  records: any[];
  duplicateCount: number;
  keepRecord: any;
  deleteRecords: any[];
}

interface AnalysisResponse {
  status: string;
  analysis: {
    duplicateGroups: DuplicateGroup[];
  };
  summary: {
    totalRecords: number;
    uniqueCompanies: number;
    duplicateGroupsFound: number;
    totalDuplicateRecords: number;
    recordsToDelete: number;
    recordsToKeep: number;
  };
}

interface AnalysisResultsProps {
  analysis: AnalysisResponse;
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Duplicate Analysis Results</CardTitle>
        <Badge variant={analysis.summary.duplicateGroupsFound > 0 ? "destructive" : "secondary"} className={analysis.summary.duplicateGroupsFound > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
          {analysis.summary.duplicateGroupsFound > 0 ? 'Duplicates Found' : 'Clean'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h3 className="text-2xl font-bold text-blue-600 mb-1">
              {analysis.summary.totalRecords}
            </h3>
            <p className="text-sm text-gray-600">Total Records</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h3 className="text-2xl font-bold text-green-600 mb-1">
              {analysis.summary.uniqueCompanies}
            </h3>
            <p className="text-sm text-gray-600">Unique Companies</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-2xl font-bold text-yellow-600 mb-1">
              {analysis.summary.duplicateGroupsFound}
            </h3>
            <p className="text-sm text-gray-600">Companies w/ Duplicates</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <h3 className="text-2xl font-bold text-red-600 mb-1">
              {analysis.summary.recordsToDelete}
            </h3>
            <p className="text-sm text-gray-600">Records to Delete</p>
          </div>
        </div>

        {analysis.summary.duplicateGroupsFound > 0 ? (
          <>
            <hr className="my-6" />
            <h4 className="text-lg font-semibold mb-4">Duplicate Groups Found</h4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>TeamTailor ID</TableHead>
                    <TableHead>Total Records</TableHead>
                    <TableHead>Keep Record (Oldest)</TableHead>
                    <TableHead>Will Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.analysis.duplicateGroups.map((group) => (
                    <TableRow key={group.teamtailor_option_id}>
                      <TableCell className="font-medium">{group.company_name}</TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">{group.teamtailor_option_id}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={group.duplicateCount > 2 ? "destructive" : "secondary"}>
                          {group.duplicateCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">{group.keepRecord.record_id}</code>
                          <br />
                          <span className="text-xs text-gray-500">
                            {new Date(group.keepRecord.created_at).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-600 font-medium">{group.deleteRecords.length} records</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <div>
              <div className="font-medium">No Duplicates Found</div>
              <AlertDescription>Your datastore is clean! No duplicate company records were found.</AlertDescription>
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, X } from "lucide-react";
import { ResponseTimeline } from "./ResponseTimeline";

interface TestResult {
  operation: string;
  timestamp: string;
  request: unknown;
  response: unknown;
  status: "success" | "error";
  error?: string;
}

interface ResponseDisplayProps {
  results: TestResult[];
  onClear: () => void;
}


export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ results, onClear }) => {

  if (results.length === 0) {
    return (
      <Card className="bg-white border-slate-200 rounded-xl shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#667eea]" />
            <span className="text-base font-semibold text-slate-800">
              Test Results
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <History className="w-8 h-8 text-slate-400" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">No test results yet</p>
              <p className="text-sm text-slate-500">Execute datastore operations to see results here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-slate-200 rounded-xl shadow-sm">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#667eea]" />
            <span className="text-base font-semibold text-slate-800">
              Test Results ({results.length})
            </span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClear} className="gap-1">
            <X className="w-4 h-4" />
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponseTimeline results={results} />
      </CardContent>
    </Card>
  );
};

"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Database } from "lucide-react";
import { DatastoreOperationForm, DatastoreRetrieveForm, ResponseDisplay } from "./components";

interface TestResult {
  operation: string;
  timestamp: string;
  request: unknown;
  response: unknown;
  status: "success" | "error";
  error?: string;
}

export default function DatastorePage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const addTestResult = (result: TestResult) => {
    setTestResults((prev) => [result, ...prev].slice(0, 20)); // Keep last 20 results
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="bg-white border-slate-200 rounded-2xl mb-8 shadow-sm">
          <CardContent className="p-8">
            <div className="flex items-center gap-4">
              <div className="w-15 h-15 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Database className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 m-0">
                  Datastore Testing
                </h1>
                <p className="text-base text-slate-500 mt-1">
                  Manually test datastore operations with custom payloads
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Operation Forms */}
          <DatastoreOperationForm onResult={addTestResult} />

          {/* Retrieve Form */}
          <DatastoreRetrieveForm onResult={addTestResult} />
        </div>

        {/* Results Display */}
        <ResponseDisplay results={testResults} onClear={clearResults} />
      </div>
    </div>
  );
}

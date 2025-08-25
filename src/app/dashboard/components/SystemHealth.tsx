"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Database, CheckCircle } from "lucide-react";

interface TestResult {
  operation: string;
  status: string;
  data: unknown;
}

interface SystemHealthProps {
  testResults: TestResult[];
  loading: boolean;
  onTestConnection: () => void;
}

export const SystemHealth: React.FC<SystemHealthProps> = ({
  testResults,
  loading,
  onTestConnection,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-500" />
          <span className="text-base font-semibold text-gray-900">
            System Health
          </span>
        </CardTitle>
        <Button
          onClick={onTestConnection}
          disabled={loading}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 rounded-md font-medium flex items-center gap-2"
        >
          <Database className="w-4 h-4" />
          {loading ? 'Testing...' : 'Test API'}
        </Button>
      </CardHeader>
      <CardContent className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="space-y-5">
          <div>
            <p className="text-gray-900 font-medium mb-2">Database Connection</p>
            <Progress value={100} className="h-2" />
          </div>

          <div>
            <p className="text-gray-900 font-medium mb-2">API Response Time</p>
            <Progress value={85} className="h-2 mb-1" />
            <p className="text-xs text-slate-500">125ms avg</p>
          </div>

          {testResults.length > 0 && (
            <div>
              <p className="font-semibold mb-3 text-gray-900">
                Latest Test Results:
              </p>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.status === "success" 
                        ? "bg-green-50 border-green-200" 
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle
                        className={`w-4 h-4 ${
                          result.status === "success" ? "text-green-600" : "text-red-600"
                        }`}
                      />
                      <p className="text-sm text-gray-900">{result.operation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

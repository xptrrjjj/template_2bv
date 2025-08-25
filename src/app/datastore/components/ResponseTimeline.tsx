"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { TestResult } from "./useDatastoreOperations";

interface ResponseTimelineProps {
  results: TestResult[];
}

interface TimelineItemProps {
  result: TestResult;
  formatTimestamp: (timestamp: string) => string;
  formatJson: (obj: unknown) => string;
  getStatusIcon: (status: "success" | "error") => React.ReactElement;
  getStatusVariant: (status: "success" | "error") => "default" | "destructive";
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  result,
  formatTimestamp,
  formatJson,
  getStatusIcon,
  getStatusVariant,
}) => {
  const [requestOpen, setRequestOpen] = useState(false);
  const [responseOpen, setResponseOpen] = useState(false);

  return (
    <div className="border-l-4 border-slate-200 pl-4 pb-4 relative">
      <div className="absolute -left-2 top-1 bg-white border border-slate-200 rounded-full p-1">
        {getStatusIcon(result.status)}
      </div>
      
      <div className="flex items-center gap-3 mb-2">
        <h4 className="font-semibold text-slate-800">{result.operation}</h4>
        <Badge variant={getStatusVariant(result.status)}>
          {result.status.toUpperCase()}
        </Badge>
        <span className="text-xs text-slate-500">
          {formatTimestamp(result.timestamp)}
        </span>
      </div>

      {result.error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{result.error}</p>
        </div>
      )}

      <div className="space-y-2">
        <Collapsible open={requestOpen} onOpenChange={setRequestOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              {requestOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="text-sm text-slate-600">Request Details</span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 max-h-48 overflow-y-auto">
              <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap">
                {formatJson(result.request)}
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={responseOpen} onOpenChange={setResponseOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              {responseOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="text-sm text-slate-600">Response Details</span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className={`border rounded-md p-3 max-h-72 overflow-y-auto ${
              result.status === "success" 
                ? "bg-green-50 border-green-200" 
                : "bg-red-50 border-red-200"
            }`}>
              <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap">
                {formatJson(result.response)}
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export const ResponseTimeline: React.FC<ResponseTimelineProps> = ({ results }) => {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatJson = (obj: unknown) => {
    return JSON.stringify(obj, null, 2);
  };

  const getStatusIcon = (status: "success" | "error") => {
    return status === "success" ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <AlertCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusVariant = (status: "success" | "error"): "default" | "destructive" => {
    return status === "success" ? "default" : "destructive";
  };

  return (
    <div className="max-h-[600px] overflow-y-auto">
      <div className="space-y-6">
        {results.map((result, index) => (
          <TimelineItem
            key={index}
            result={result}
            formatTimestamp={formatTimestamp}
            formatJson={formatJson}
            getStatusIcon={getStatusIcon}
            getStatusVariant={getStatusVariant}
          />
        ))}
      </div>
    </div>
  );
};
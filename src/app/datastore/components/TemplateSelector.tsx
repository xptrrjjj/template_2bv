"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface TemplateSelectorProps {
  onLoadTemplate: (action: string) => void;
  type?: "operation" | "retrieve";
}

const operationTemplates = [
  { key: "create", label: "Create" },
  { key: "update", label: "Update" },
  { key: "append", label: "Append" },
  { key: "delete", label: "Delete" },
  { key: "delete_all", label: "Delete All" },
];

const retrieveTemplates = [
  { key: "all_records", label: "All Records" },
  { key: "by_status", label: "By Status" },
  { key: "by_position", label: "By Position" },
  { key: "by_record_id", label: "By Record ID" },
  { key: "multiple_filters", label: "Multiple Filters" },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onLoadTemplate,
  type = "operation",
}) => {
  const templates = type === "operation" ? operationTemplates : retrieveTemplates;

  return (
    <div className="mb-4">
      <p className="font-semibold text-slate-800 mb-2 block">
        Quick Templates:
      </p>
      <div className="flex flex-wrap gap-2">
        {templates.map((template) => (
          <Button
            key={template.key}
            size="sm"
            variant="outline"
            onClick={() => onLoadTemplate(template.key)}
            className="gap-1"
          >
            <Zap className="w-3 h-3" />
            {template.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
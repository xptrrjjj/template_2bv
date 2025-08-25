"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SystemInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-b pb-2 mb-2">
            <dt className="text-sm font-medium text-slate-600">Application ID</dt>
            <dd className="text-sm text-slate-900">
              {process.env.NEXT_PUBLIC_APP_ID || "recruitment_tool"}
            </dd>
          </div>
          <div className="border-b pb-2 mb-2">
            <dt className="text-sm font-medium text-slate-600">Application Name</dt>
            <dd className="text-sm text-slate-900">
              {process.env.NEXT_PUBLIC_APP_NAME || "Recruitment Tool"}
            </dd>
          </div>
          <div className="border-b pb-2 mb-2">
            <dt className="text-sm font-medium text-slate-600">Default Role</dt>
            <dd className="text-sm text-slate-900">
              {process.env.NEXT_PUBLIC_DEFAULT_ROLE || "app_viewer"}
            </dd>
          </div>
          <div className="border-b pb-2 mb-2">
            <dt className="text-sm font-medium text-slate-600">Auto Provision Users</dt>
            <dd className="text-sm text-slate-900">
              {process.env.NEXT_PUBLIC_AUTO_PROVISION_USERS === "true"
                ? "Enabled"
                : "Disabled"}
            </dd>
          </div>
          <div className="border-b pb-2 mb-2">
            <dt className="text-sm font-medium text-slate-600">Require Explicit Access</dt>
            <dd className="text-sm text-slate-900">
              {process.env.NEXT_PUBLIC_REQUIRE_EXPLICIT_ACCESS === "true" ? "Yes" : "No"}
            </dd>
          </div>
          <div className="border-b pb-2 mb-2">
            <dt className="text-sm font-medium text-slate-600">Environment</dt>
            <dd className="text-sm text-slate-900">
              <Badge 
                variant={process.env.NODE_ENV === "production" ? "destructive" : "secondary"}
              >
                {process.env.NODE_ENV?.toUpperCase() || "DEVELOPMENT"}
              </Badge>
            </dd>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
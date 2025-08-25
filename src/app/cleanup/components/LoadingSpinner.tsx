"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface LoadingSpinnerProps {
  loading: boolean;
}

export function LoadingSpinner({ loading }: LoadingSpinnerProps) {
  if (!loading) return null;

  return (
    <Card className="mb-6 text-center p-8">
      <Spinner size="lg" className="mx-auto mb-4" />
      <p className="text-gray-600">Processing datastore records...</p>
    </Card>
  );
}
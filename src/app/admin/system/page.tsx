"use client";

import React from "react";
import { SuperAdminOnly } from "@/components/guards";
import {
  SystemHeader,
  SystemHealthAlert,
  SystemStats,
  BootstrapStatus,
  SystemActions,
  SystemInfo,
  useSystemManagement,
} from "./components";

export default function SystemPage() {
  const {
    health,
    progress,
    loading,
    bootstrapping,
    resetting,
    isSystemHealthy,
    loadSystemInfo,
    handleBootstrapSystem,
    handleResetSystem,
    handleRepairSystem,
  } = useSystemManagement();

  return (
    <SuperAdminOnly>
      <div className="p-8 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <SystemHeader onRefresh={loadSystemInfo} loading={loading} />

          <SystemHealthAlert health={health} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SystemStats health={health} />
            <BootstrapStatus progress={progress} />
          </div>

          <SystemActions
            isSystemHealthy={isSystemHealthy || false}
            bootstrapping={bootstrapping}
            resetting={resetting}
            onBootstrapSystem={handleBootstrapSystem}
            onRepairSystem={handleRepairSystem}
            onResetSystem={handleResetSystem}
          />

          <SystemInfo />
        </div>
      </div>
    </SuperAdminOnly>
  );
}
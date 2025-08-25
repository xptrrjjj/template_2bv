"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { bootstrapService } from "@/services/rbac";
import { SystemHealthCheck, BootstrapResult } from "@/types/rbac";

interface BootstrapProgress {
  applications: { created: number; total: number };
  permissions: { created: number; total: number };
  roles: { created: number; total: number };
  superAdmins: { assigned: number; total: number };
}

export function useSystemManagement() {
  const { toast } = useToast();
  const [health, setHealth] = useState<SystemHealthCheck | null>(null);
  const [progress, setProgress] = useState<BootstrapProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [resetting, setResetting] = useState(false);

  const loadSystemInfo = useCallback(async () => {
    try {
      setLoading(true);
      const [healthData, progressData] = await Promise.all([
        bootstrapService.getSystemHealth(),
        bootstrapService.getBootstrapProgress(),
      ]);

      setHealth(healthData);
      setProgress(progressData);
    } catch (error) {
      console.error("Failed to load system info:", error);
      toast({
        title: "Error",
        description: "Failed to load system information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSystemInfo();
  }, [loadSystemInfo]);

  const handleBootstrapSystem = async () => {
    try {
      setBootstrapping(true);
      const result: BootstrapResult = await bootstrapService.bootstrapSystem();

      if (result.success) {
        toast({
          title: "Success",
          description: "System bootstrapped successfully",
        });
      } else {
        toast({
          title: "Warning",
          description: `Bootstrap completed with ${result.errors.length} errors`,
        });
      }

      loadSystemInfo();
    } catch (error) {
      console.error("Bootstrap failed:", error);
      toast({
        title: "Error",
        description: "System bootstrap failed",
        variant: "destructive",
      });
    } finally {
      setBootstrapping(false);
    }
  };

  const handleResetSystem = async () => {
    try {
      setResetting(true);
      await bootstrapService.resetSystem();
      toast({
        title: "Success",
        description: "System reset successfully",
      });
      loadSystemInfo();
    } catch (error) {
      console.error("Reset failed:", error);
      toast({
        title: "Error",
        description: "System reset failed",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  const handleRepairSystem = async () => {
    try {
      setBootstrapping(true);
      const result = await bootstrapService.repairSystem();

      if (result.repaired.length > 0) {
        toast({
          title: "Success",
          description: `System repaired: ${result.repaired.join(", ")}`,
        });
      }

      if (result.failed.length > 0) {
        toast({
          title: "Error",
          description: `Repair failed for: ${result.failed.join(", ")}`,
          variant: "destructive",
        });
      }

      loadSystemInfo();
    } catch (error) {
      console.error("Repair failed:", error);
      toast({
        title: "Error",
        description: "System repair failed",
        variant: "destructive",
      });
    } finally {
      setBootstrapping(false);
    }
  };

  const isSystemHealthy =
    health?.healthy &&
    progress?.applications.created === progress?.applications.total &&
    progress?.permissions.created === progress?.permissions.total &&
    progress?.roles.created === progress?.roles.total;

  return {
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
  };
}
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Settings,
  RotateCw,
  CheckCircle,
  Trash2,
} from "lucide-react";

interface SystemActionsProps {
  isSystemHealthy: boolean;
  bootstrapping: boolean;
  resetting: boolean;
  onBootstrapSystem: () => void;
  onRepairSystem: () => void;
  onResetSystem: () => void;
}

export function SystemActions({
  isSystemHealthy,
  bootstrapping,
  resetting,
  onBootstrapSystem,
  onRepairSystem,
  onResetSystem,
}: SystemActionsProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-500" />
          System Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-2">Bootstrap System</h3>
            <p className="text-slate-600 mb-4">
              Initialize the RBAC system with default applications, roles, and permissions.
            </p>
            <Button
              onClick={onBootstrapSystem}
              disabled={bootstrapping || isSystemHealthy}
              className={isSystemHealthy ? "" : "bg-green-600 hover:bg-green-700"}
            >
              <RotateCw className="h-4 w-4 mr-2" />
              {isSystemHealthy ? "System Already Bootstrapped" : "Bootstrap System"}
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Repair System</h3>
            <p className="text-slate-600 mb-4">
              Repair common system issues and ensure all components are properly configured.
            </p>
            <Button
              variant="outline"
              onClick={onRepairSystem}
              disabled={bootstrapping}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Repair System
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Danger Zone
            </h3>
            <p className="text-slate-600 mb-4">
              <strong>Warning:</strong> This action will completely reset the RBAC system
              and delete all users, roles, and permissions.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={resetting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset System
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset System</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to reset the entire RBAC system? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onResetSystem}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-slate-200 p-5 px-8 flex justify-between items-center shadow-sm">
        <div>
          <Skeleton className="w-[200px] h-6" />
          <div className="mt-2">
            <Skeleton className="w-[300px] h-3.5" />
          </div>
        </div>
        <div className="flex gap-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-20 h-10 rounded" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-8">
        <div className="max-w-[1400px] mx-auto">
          {/* Welcome Card Skeleton */}
          <Card className="bg-white border-slate-200 rounded-2xl mb-8 shadow-sm">
            <CardContent className="p-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="w-[400px] h-8" />
                  <div className="mt-4">
                    <Skeleton className="w-[500px] h-4" />
                  </div>
                </div>
                <div>
                  <Skeleton className="w-[100px] h-[100px] rounded" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-white border-slate-200 rounded-xl shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="w-12 h-12 rounded" />
                    <Skeleton className="w-[120px] h-3.5" />
                    <Skeleton className="w-20 h-7" />
                    <Skeleton className="w-[100px] h-3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-white border-slate-200 rounded-xl shadow-sm">
                <CardContent className="p-6">
                  <Skeleton className="w-[200px] h-4" />
                  <div className="mt-6">
                    <div className="space-y-6">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="flex justify-between">
                            <div className="flex gap-4">
                              <Skeleton className="w-2 h-2 rounded-full" />
                              <div>
                                <Skeleton className="w-[200px] h-4" />
                                <div className="mt-2">
                                  <Skeleton className="w-[150px] h-3.5" />
                                </div>
                              </div>
                            </div>
                            <Skeleton className="w-[60px] h-3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="bg-white border-slate-200 rounded-xl shadow-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between mb-6">
                    <Skeleton className="w-[120px] h-4" />
                    <Skeleton className="w-20 h-8 rounded" />
                  </div>
                  <div className="space-y-4">
                    <div className="mb-5">
                      <Skeleton className="w-[150px] h-3.5" />
                      <div className="mt-2">
                        <Skeleton className="w-full h-2" />
                      </div>
                    </div>
                    <div className="mb-5">
                      <Skeleton className="w-[130px] h-3.5" />
                      <div className="mt-2">
                        <Skeleton className="w-full h-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

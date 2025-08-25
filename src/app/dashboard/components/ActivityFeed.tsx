"use client";

import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  position: string;
  time: string;
  status: "new" | "scheduled" | "success";
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const defaultActivities: ActivityItem[] = [
    {
      id: "1",
      action: "New candidate applied",
      position: "Senior Developer",
      time: "2 hours ago",
      status: "new",
    },
    {
      id: "2",
      action: "Interview scheduled",
      position: "Product Manager",
      time: "4 hours ago",
      status: "scheduled",
    },
    {
      id: "3",
      action: "Candidate hired",
      position: "UX Designer",
      time: "1 day ago",
      status: "success",
    },
  ];

  const currentActivities = activities || defaultActivities;

  const getStatusColor = (status: ActivityItem["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="bg-white border-slate-200 rounded-xl shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#667eea]" />
          <span className="text-base font-semibold text-slate-800">
            Recent Activity
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
      <div className="space-y-4 w-full">
        {currentActivities.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
          >
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(item.status)}>
                {item.status}
              </Badge>
              <div>
                <p className="font-semibold text-slate-800">
                  {item.action}
                </p>
                <p className="text-slate-500 text-sm">{item.position}</p>
              </div>
            </div>
            <span className="text-xs text-slate-400">{item.time}</span>
          </div>
        ))}
      </div>
      </CardContent>
    </Card>
  );
};

"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User as UserIcon, LogOut } from "lucide-react";
import { User } from "@/types/auth";

interface DashboardHeaderProps {
  user: User | null;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, onLogout }) => {
  return (
    <div className="bg-white border-b border-slate-200 py-5 px-8 flex justify-between items-center shadow-sm">
      <div>
        <h3 className="text-xl font-bold text-slate-800 m-0">
          Recruitment Dashboard
        </h3>
        <p className="text-sm text-slate-500">
          Manage your recruitment process efficiently
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 p-3 px-4 bg-slate-100 rounded-xl border border-slate-200">
          <Avatar className="w-10 h-10 border-2 border-[#667eea]">
            <AvatarImage src={user?.profilePicture} />
            <AvatarFallback>
              <UserIcon className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm text-slate-800 block">
              {user?.name}
            </p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>

        <Button
          onClick={onLogout}
          variant="outline"
          className="bg-white border-red-500 text-red-500 font-medium h-10 px-5 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

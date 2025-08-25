import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, ChevronDown } from "lucide-react";
import { User as UserType } from "@/types/auth";

interface UserProfileProps {
  user: UserType | null;
  collapsed: boolean;
  onLogout: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, collapsed, onLogout }) => {
  return (
    <div
      className={`
        ${collapsed ? "p-4 px-2" : "p-4 px-6"}
        border-t border-slate-200 bg-slate-50 shrink-0
      `}
    >
      {!collapsed ? (
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <div className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-100">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.profilePicture} alt={user?.name} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium text-sm text-slate-900 truncate">
                  {user?.name}
                </div>
                <div className="text-xs text-slate-600 truncate">
                  {user?.email}
                </div>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-500" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="text-center">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={user?.profilePicture} alt={user?.name} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem disabled>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};
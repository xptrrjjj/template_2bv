import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

// Simple spinner component
const Spinner = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
      className
    )}
  />
);

interface AuthLoadingScreenProps {
  message?: string;
  description?: string;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  message = "Loading...",
  description = "Checking authentication status"
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center p-5">
      <Card className="max-w-[450px] w-full bg-white/95 backdrop-blur-sm border-none rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
        <CardContent className="p-8 text-center">
        <div className="space-y-6 w-full">
          <div className="relative w-20 h-20 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center mx-auto shadow-[0_8px_16px_rgba(102,126,234,0.3)]">
            <User className="w-8 h-8 text-white" />
            <Spinner className="absolute -inset-2.5 w-[100px] h-[100px]" />
          </div>
          <h3 className="text-[#2c3e50] text-xl font-semibold m-0">
            {message}
          </h3>
          <p className="text-[#7f8c8d] m-0">
            {description}
          </p>
        </div>
        </CardContent>
      </Card>
    </div>
  );
};
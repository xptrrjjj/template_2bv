import React from "react";

interface BrandLogoProps {
  collapsed: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ collapsed }) => {
  return (
    <div
      className={`
        ${collapsed ? "p-4 px-2" : "p-6"}
        border-b border-slate-200 h-20 flex items-center
        ${collapsed ? "justify-center" : "justify-start"}
        shrink-0 ${collapsed ? "text-center" : "text-left"}
      `}
    >
      {!collapsed ? (
        <h1 className="text-xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent">
          Recruitment Tool
        </h1>
      ) : (
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-base">R</span>
        </div>
      )}
    </div>
  );
};
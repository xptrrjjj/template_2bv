import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle, XCircle, Info } from "lucide-react"

interface ResultProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: "success" | "error" | "warning" | "info" | "403" | "404" | "500"
  resultTitle?: React.ReactNode
  subTitle?: React.ReactNode
  icon?: React.ReactNode
  extra?: React.ReactNode
}

const statusConfig = {
  success: {
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-50"
  },
  error: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-50"
  },
  warning: {
    icon: AlertCircle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50"
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bgColor: "bg-blue-50"
  },
  "403": {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-50"
  },
  "404": {
    icon: AlertCircle,
    color: "text-gray-500",
    bgColor: "bg-gray-50"
  },
  "500": {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-50"
  }
}

function Result({ 
  className, 
  status = "info", 
  resultTitle, 
  subTitle, 
  icon, 
  extra, 
  ...props 
}: ResultProps) {
  const config = statusConfig[status]
  const IconComponent = config.icon

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 min-h-[400px]",
        className
      )}
      {...props}
    >
      <div className={cn("mb-4 p-4 rounded-full", config.bgColor)}>
        {icon || <IconComponent className={cn("w-16 h-16", config.color)} />}
      </div>
      
      {resultTitle && (
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {resultTitle}
        </h3>
      )}
      
      {subTitle && (
        <p className="text-gray-600 mb-6 max-w-md">
          {subTitle}
        </p>
      )}
      
      {extra && (
        <div className="mt-4">
          {extra}
        </div>
      )}
    </div>
  )
}

export { Result }
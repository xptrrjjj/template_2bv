import * as React from "react"
import { cn } from "@/lib/utils"

const Timeline = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
Timeline.displayName = "Timeline"

const TimelineItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative pb-8 last:pb-0", className)}
    {...props}
  />
))
TimelineItem.displayName = "TimelineItem"

const TimelineDot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    color?: "blue" | "green" | "red" | "gray"
  }
>(({ className, color = "blue", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 bg-white",
      {
        "border-blue-500": color === "blue",
        "border-green-500": color === "green", 
        "border-red-500": color === "red",
        "border-gray-500": color === "gray",
      },
      className
    )}
    {...props}
  />
))
TimelineDot.displayName = "TimelineDot"

const TimelineConnector = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("absolute left-1.5 top-6 h-full w-0.5 bg-gray-200", className)}
    {...props}
  />
))
TimelineConnector.displayName = "TimelineConnector"

const TimelineContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("ml-8", className)}
    {...props}
  />
))
TimelineContent.displayName = "TimelineContent"

export { Timeline, TimelineItem, TimelineDot, TimelineConnector, TimelineContent }
import * as React from "react"
import { cn } from "@/lib/utils"
import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: React.ReactNode
  imageStyle?: React.CSSProperties
  description?: React.ReactNode
  actions?: React.ReactNode
}

const Empty = React.forwardRef<HTMLDivElement, EmptyProps>(
  ({ className, image, imageStyle, description, actions, children, ...props }, ref) => {
    const defaultImage = (
      <FileQuestion 
        className="h-16 w-16 text-muted-foreground/50" 
        style={imageStyle}
      />
    )

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center py-12 text-center",
          className
        )}
        {...props}
      >
        <div className="mb-4">
          {image || defaultImage}
        </div>
        {description && (
          <div className="mb-4 text-sm text-muted-foreground">
            {description}
          </div>
        )}
        {actions && (
          <div className="space-y-2">
            {actions}
          </div>
        )}
        {children}
      </div>
    )
  }
)
Empty.displayName = "Empty"

export { Empty }
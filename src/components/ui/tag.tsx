import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const tagVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
        warning:
          "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        info:
          "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {
  closable?: boolean
  onClose?: () => void
}

const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant, closable, onClose, children, ...props }, ref) => {
    return (
      <span
        className={cn(tagVariants({ variant }), className)}
        ref={ref}
        {...props}
      >
        {children}
        {closable && (
          <button
            type="button"
            className="ml-1 rounded-full hover:bg-black/10 p-0.5"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </span>
    )
  }
)
Tag.displayName = "Tag"

export { Tag, tagVariants }
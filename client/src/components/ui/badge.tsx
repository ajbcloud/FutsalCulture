import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand text-brand-contrast hover:bg-brand-hover",
        secondary:
          "border-transparent bg-input text-text hover:bg-border-hover",
        destructive:
          "border-transparent bg-danger text-danger-contrast hover:bg-danger/80",
        outline: "border-border text-text hover:bg-input",
        success:
          "border-transparent bg-success text-success-contrast hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-contrast hover:bg-warning/80",
        info:
          "border-transparent bg-info text-info-contrast hover:bg-info/80",
        disabled:
          "border-transparent bg-text-subtle text-text-muted hover:bg-text-subtle/80 cursor-not-allowed",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

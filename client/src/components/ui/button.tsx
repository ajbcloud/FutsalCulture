import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useCustomTheme } from "@/contexts/CustomThemeContext"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-brand text-brand-contrast hover:bg-brand-hover",
        destructive:
          "bg-danger text-danger-contrast hover:bg-danger/90",
        outline:
          "border border-border bg-bg hover:bg-input hover:text-text",
        secondary:
          "bg-input text-text hover:bg-border-hover",
        ghost: "hover:bg-input hover:text-text",
        link: "text-link underline-offset-4 hover:underline hover:text-link-hover",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const { theme } = useCustomTheme();
    const Comp = asChild ? Slot : "button"
    
    // Apply custom theme colors via inline styles (works in both light and dark mode)
    let customStyle = style || {};
    
    if (theme) {
      // Apply custom primary color to default variant
      if (variant === 'default' || variant === undefined) {
        customStyle = {
          ...customStyle,
          backgroundColor: theme.primaryButton,
          borderColor: theme.primaryButton,
          color: '#ffffff'
        };
      } else if (variant === 'secondary') {
        customStyle = {
          ...customStyle,
          backgroundColor: theme.secondaryButton,
          borderColor: theme.secondaryButton,
          color: '#ffffff'
        };
      }
    }
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        style={customStyle}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

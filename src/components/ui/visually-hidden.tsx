import * as React from "react"
import { cn } from "@/lib/utils"

interface VisuallyHiddenProps {
  children: React.ReactNode
  className?: string
}

const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  VisuallyHiddenProps
>(({ children, className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
      className
    )}
    {...props}
  >
    {children}
  </span>
))
VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }

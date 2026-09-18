import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "min-h-11 w-full border border-line bg-transparent px-4 py-3 text-sm text-fg outline-none",
        "placeholder:text-muted/70 focus:border-accent",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

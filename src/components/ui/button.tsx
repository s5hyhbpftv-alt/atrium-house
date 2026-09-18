import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 border font-sans font-medium uppercase tracking-widest transition-colors duration-150 ease-out disabled:opacity-50",
  {
    variants: {
      variant: {
        solid: "border-fg bg-fg text-ink hover:bg-accent hover:border-accent hover:text-ink",
        outline: "border-accent bg-transparent text-fg hover:bg-accent hover:text-ink",
        ghost: "border-transparent text-accent hover:text-fg",
      },
      size: {
        md: "min-h-11 px-5 py-3 text-xs",
        sm: "min-h-11 px-3 py-2 text-xs",
      },
    },
    defaultVariants: { variant: "outline", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = "Button";

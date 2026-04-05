import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "secondary" | "ghost" | "outline";
  size?: "default" | "sm" | "lg";
}

const buttonVariants = {
  default:
    "bg-[color:var(--foreground)] text-white shadow-[0_12px_30px_rgba(31,41,55,0.14)] hover:opacity-90",
  secondary: "border border-[color:rgba(31,41,55,0.16)] bg-white text-[color:var(--foreground)] hover:bg-[rgba(31,41,55,0.04)]",
  ghost: "bg-transparent text-[color:var(--foreground)] hover:bg-[rgba(31,41,55,0.06)]",
  outline: "border border-[color:rgba(31,41,55,0.16)] bg-white text-[color:var(--foreground)] hover:bg-[rgba(31,41,55,0.04)]",
};

const buttonSizes = {
  default: "h-11 px-4 py-2",
  sm: "h-9 px-3 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
          buttonVariants[variant],
          buttonSizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

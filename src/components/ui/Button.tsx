import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0d0a09] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]";

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5 h-8",
      md: "text-sm px-4 py-2.5 gap-2 h-11",
      lg: "text-base px-6 py-3.5 gap-2.5 h-13",
    };

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-[#e2602c] to-[#f28b44] text-white shadow-lg shadow-[#e2602c]/25 hover:shadow-[#e2602c]/40 hover:brightness-110 focus:ring-[#e2602c]",
      secondary:
        "bg-[#241c19] text-[#f4ede6] border border-[#3d2e27] hover:bg-[#2e2320] hover:border-[#e2602c]/50 focus:ring-[#e2602c]",
      outline:
        "bg-transparent text-[#f4ede6] border border-[#3d2e27] hover:border-[#e2602c] hover:bg-[#e2602c]/10 text-white focus:ring-[#e2602c]",
      ghost:
        "bg-transparent text-[#d4c6bd] hover:text-white hover:bg-white/5 focus:ring-[#e2602c]",
      danger:
        "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-600/25 hover:brightness-110 focus:ring-red-500",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "outline";
}

export function Badge({ className, variant = "primary", children, ...props }: BadgeProps) {
  const styles = {
    primary: "bg-[#e2602c]/15 text-[#f28b44] border border-[#e2602c]/30",
    secondary: "bg-[#251e1b] text-[#c4b5ad] border border-[#3d2e27]",
    success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    outline: "bg-transparent text-[#c4b5ad] border border-[#3d2e27]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

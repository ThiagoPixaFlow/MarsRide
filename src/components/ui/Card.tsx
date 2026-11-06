import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "solid" | "glow";
}

export function Card({ className, variant = "glass", children, ...props }: CardProps) {
  const styles = {
    glass: "mars-glass-card rounded-2xl p-5 text-[#f4ede6]",
    solid: "bg-[#181311] border border-[#332621] rounded-2xl p-5 text-[#f4ede6] shadow-xl",
    glow: "mars-glass-card mars-glow-sm rounded-2xl p-5 text-[#f4ede6]",
  };

  return (
    <div className={cn(styles[variant], className)} {...props}>
      {children}
    </div>
  );
}

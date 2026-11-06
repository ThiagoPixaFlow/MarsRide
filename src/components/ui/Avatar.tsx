"use client";

import React, { useState } from "react";
import { cn, initials } from "@/lib/utils";
import { Bot, Sparkles } from "lucide-react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  image?: string;
  color?: string;
  isBot?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Avatar({
  className,
  name,
  image,
  color = "#e2602c",
  isBot = false,
  size = "md",
  ...props
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const sizeStyles = {
    sm: "w-8 h-8 text-xs rounded-xl",
    md: "w-10 h-10 text-sm rounded-xl",
    lg: "w-14 h-14 text-base rounded-2xl",
    xl: "w-20 h-20 text-xl font-bold rounded-2xl",
    "2xl": "w-24 h-24 text-2xl font-black rounded-3xl",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
    xl: "w-10 h-10",
    "2xl": "w-12 h-12",
  };

  const showImage = Boolean(image) && !hasError;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center font-semibold text-white shadow-lg shrink-0 border border-white/10 select-none overflow-hidden transition-transform",
        sizeStyles[size],
        className
      )}
      style={{
        backgroundColor: color,
        background: `linear-gradient(135deg, ${color} 0%, rgba(13, 10, 9, 0.9) 100%)`,
      }}
      {...props}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover select-none pointer-events-none"
          onError={() => setHasError(true)}
        />
      ) : isBot ? (
        <Bot className={iconSizes[size]} />
      ) : (
        <span>{initials(name)}</span>
      )}

      {isBot && (
        <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-[#0d0a09] rounded-full border border-white/10 z-10">
          <Sparkles className="w-2.5 h-2.5 text-[#f28b44]" />
        </div>
      )}
    </div>
  );
}

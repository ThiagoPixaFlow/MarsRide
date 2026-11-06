import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[#c4b5ad] flex items-center justify-between">
            <span>{label}</span>
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[#8c7d75]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-11 px-3.5 rounded-xl bg-[#181311] border border-[#332621] text-[#f4ede6] placeholder:text-[#6a5e57] text-sm transition-all duration-200 outline-none focus:border-[#e2602c] focus:ring-1 focus:ring-[#e2602c] disabled:opacity-50 disabled:cursor-not-allowed",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-500/80 focus:border-red-500 focus:ring-red-500/30",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-[#8c7d75]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
        {!error && helperText && <span className="text-xs text-[#8c7d75]">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

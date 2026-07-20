"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AhnaraInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  variant?: "default" | "search" | "phone";
  error?: string;
  prefix?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const AhnaraInput = React.forwardRef<HTMLInputElement, AhnaraInputProps>(
  ({ className, label, variant = "default", error, prefix, leftIcon, rightIcon, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

    React.useEffect(() => {
      if (props.value !== undefined) {
        setHasValue(!!props.value);
      }
    }, [props.value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      onBlur?.(e);
    };

    const isFloating = isFocused || hasValue;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div
          className={cn(
            "relative flex items-center h-11 rounded-xl border bg-white dark:bg-slate-900 transition-all duration-200 shadow-sm",
            isFocused ? "border-[#0089C1] ring-2 ring-[#0089C1]/20" : "border-slate-200 dark:border-slate-800",
            error && "border-rose-500",
            className
          )}
        >
          {variant === "search" && (
            <div className="pl-3 pr-2 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
          )}

          {variant === "phone" && (
            <div className="flex items-center gap-2 px-3 border-r border-slate-200 text-slate-800 font-medium">
              <div className="w-5 h-3.5 flex-shrink-0 relative overflow-hidden rounded-[2px] shadow-sm">
                <div className="absolute inset-0 flex">
                  <div className="w-1/3 h-full bg-[#008751]" />
                  <div className="w-1/3 h-full bg-white" />
                  <div className="w-1/3 h-full bg-[#008751]" />
                </div>
              </div>
              <span className="text-xs font-bold">+234</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          )}

          {leftIcon && (
            <div className="pl-3 pr-2 text-slate-400 flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          {prefix && <div className="pl-3 pr-2 text-slate-500 font-medium text-xs">{prefix}</div>}

          <input
            ref={ref}
            className={cn(
              "w-full h-full bg-transparent px-3 outline-none text-slate-900 dark:text-white text-sm font-medium",
              "placeholder:text-slate-400",
              leftIcon && "pl-1"
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={(e) => {
              setHasValue(!!e.target.value);
              props.onChange?.(e);
            }}
            {...props}
          />

          {rightIcon && (
            <div className="pr-3 pl-1 text-slate-400 flex items-center justify-center">
              {rightIcon}
            </div>
          )}

          <AnimatePresence>
            {variant === "search" && hasValue && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => {
                  /* handle clear */
                }}
                className="pr-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {error && <span className="text-xs font-semibold text-rose-500 px-1">{error}</span>}
      </div>
    );
  }
);

AhnaraInput.displayName = "AhnaraInput";

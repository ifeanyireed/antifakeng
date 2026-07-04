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
      <div className="flex flex-col gap-1 w-full">
        <div
          className={cn(
            "relative flex items-center h-12 rounded-lg border-[0.5px] bg-ahnara-bg-surface transition-all duration-200",
            isFocused ? "border-ahnara-brand shadow-[0_0_0_0.5px_var(--ahnara-brand-glow)]" : "border-ahnara-border",
            error && "border-ahnara-coral animate-[shake_0.4s_ease-in-out]",
            className
          )}
        >
          {variant === "search" && (
            <div className="pl-3 pr-2 text-ahnara-text-faint">
              <Search className="w-5 h-5" />
            </div>
          )}

          {variant === "phone" && (
            <div className="flex items-center gap-2 px-3 border-r border-ahnara-border text-ahnara-text-primary">
              <div className="w-6 h-4 flex-shrink-0 relative overflow-hidden rounded-[2px] shadow-sm">
                <div className="absolute inset-0 flex">
                  <div className="w-1/3 h-full bg-[#008751]" />
                  <div className="w-1/3 h-full bg-white" />
                  <div className="w-1/3 h-full bg-[#008751]" />
                </div>
              </div>
              <span className="text-sm font-medium">+234</span>
              <ChevronDown className="w-4 h-4 text-ahnara-text-faint" />
            </div>
          )}

          {leftIcon && (
            <div className="pl-3 pr-1 text-ahnara-text-faint">
              {leftIcon}
            </div>
          )}

          {prefix && <div className="pl-3 pr-2">{prefix}</div>}

          <div className="relative flex-1 h-full px-3">
            {label && (
              <motion.label
                initial={false}
                animate={{
                  y: isFloating ? -24 : 0,
                  scale: isFloating ? 0.85 : 1,
                  color: isFocused ? "var(--ahnara-brand)" : "var(--ahnara-text-muted)",
                  backgroundColor: isFloating ? "var(--ahnara-bg-surface)" : "transparent",
                  paddingLeft: isFloating ? "4px" : "0px",
                  paddingRight: isFloating ? "4px" : "0px",
                }}
                className={cn(
                  "absolute left-3 top-3 origin-left pointer-events-none transition-[color,padding,background-color] z-10",
                  (leftIcon || variant === "search") && !isFloating && "left-0"
                )}
              >
                {label}
              </motion.label>
            )}
            <input
              ref={ref}
              className={cn(
                "w-full h-full bg-transparent outline-none text-ahnara-text-primary pt-1 transition-all",
                "placeholder:text-ahnara-text-faint placeholder:transition-opacity placeholder:duration-200",
                "placeholder:opacity-0 hover:placeholder:opacity-100 focus:placeholder:opacity-100",
                !label && "pt-0"
              )}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={(e) => {
                setHasValue(!!e.target.value);
                props.onChange?.(e);
              }}
              {...props}
            />
          </div>

          {rightIcon && (
            <div className="pr-3 pl-1 text-ahnara-text-faint">
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
                className="pr-3 text-ahnara-text-faint hover:text-ahnara-text-secondary"
              >
                <X className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {error && <span className="text-xs text-ahnara-coral px-1">{error}</span>}
      </div>
    );
  }
);

AhnaraInput.displayName = "AhnaraInput";

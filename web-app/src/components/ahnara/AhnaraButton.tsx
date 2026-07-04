"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AhnaraButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "success";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const AhnaraButton = React.forwardRef<HTMLButtonElement, AhnaraButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, leftIcon, rightIcon, children, ...props }, ref) => {
    const variants = {
      primary: "bg-ahnara-brand text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] border-[0.5px] border-ahnara-brand/20 hover:bg-ahnara-brand/90",
      secondary: "liquid-glass text-ahnara-text-primary shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-[0.5px] border-black/5 dark:border-white/10",
      ghost: "hover:bg-ahnara-brand-light text-ahnara-brand dark:hover:bg-white/5",
      danger: "bg-ahnara-coral text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_4px_rgba(0,0,0,0.1)] border-[0.5px] border-ahnara-coral/20 hover:bg-ahnara-coral/90",
      outline: "border border-ahnara-border bg-transparent text-ahnara-text-secondary hover:bg-ahnara-bg-surface hover:text-ahnara-text-primary dark:border-ahnara-border-mid",
      success: "bg-ahnara-accent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_4px_rgba(0,0,0,0.1)] border-[0.5px] border-ahnara-accent/20 hover:bg-ahnara-accent/90",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
      xl: "h-14 px-8 text-lg font-semibold",
    };

    return (
      <motion.button
        ref={ref as any}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={cn(
          "relative flex items-center justify-center gap-2 rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-ahnara-brand-glow disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading}
        {...(props as any)}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!isLoading && leftIcon}
        <span className={cn(isLoading && "opacity-0")}>{children}</span>
        {!isLoading && rightIcon}
        
        {/* Ripple effect placeholder - complex ripple would need a separate component or hook */}
        <motion.span
          initial={{ scale: 0, opacity: 0.35 }}
          whileTap={{ scale: 4, opacity: 0 }}
          className="absolute inset-0 bg-white/35 rounded-full pointer-events-none"
          transition={{ duration: 0.5 }}
        />
      </motion.button>
    );
  }
);

AhnaraButton.displayName = "AhnaraButton";

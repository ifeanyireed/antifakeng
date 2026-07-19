"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface AhnaraCardProps extends HTMLMotionProps<"div"> {
  variant?: "glass" | "flat" | "elevated" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
}

export const AhnaraCard = React.forwardRef<HTMLDivElement, AhnaraCardProps>(
  ({ className, variant = "glass", padding = "md", children, ...props }, ref) => {
    const variants = {
      glass: "liquid-glass",
      flat: "bg-ahnara-bg-surface border-[0.5px] border-ahnara-border",
      elevated: "bg-ahnara-bg-surface border-[0.5px] border-ahnara-border shadow-md",
      interactive: "liquid-glass cursor-pointer hover:border-ahnara-brand/50 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)]",
    };

    const paddings = {
      none: "p-0",
      sm: "p-3",
      md: "p-5",
      lg: "p-8",
    };

    const isInteractive = variant === "interactive";

    return (
      <motion.div
        ref={ref}
        whileHover={isInteractive ? { y: -8, scale: 1.01 } : undefined}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "rounded-2xl overflow-hidden",
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AhnaraCard.displayName = "AhnaraCard";

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface AhnaraBadgeProps {
  variant?: "brand" | "secondary" | "success" | "warning" | "danger" | "neutral" | "verified";
  children: React.ReactNode;
  className?: string;
}

export const AhnaraBadge = ({ variant = "neutral", children, className }: AhnaraBadgeProps) => {
  const variants = {
    brand: "bg-ahnara-brand-light text-ahnara-brand",
    secondary: "bg-ahnara-bg-surface text-ahnara-text-primary border border-ahnara-border",
    success: "bg-ahnara-accent-light text-ahnara-accent",
    warning: "bg-ahnara-amber-light text-ahnara-amber",
    danger: "bg-red-50 text-ahnara-coral dark:bg-red-900/10",
    neutral: "bg-ahnara-bg-base text-ahnara-text-secondary border border-ahnara-border",
    verified: "bg-[#FEF9C3] text-[#A16207] dark:bg-[#A16207]/10 dark:text-[#FDE047] flex items-center gap-1",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold relative overflow-hidden",
        variants[variant],
        className
      )}
    >
      {variant === "verified" && (
        <div className="relative">
          <ShieldCheck className="w-3 h-3" />
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-white/40 skew-x-12 blur-[2px]"
          />
        </div>
      )}
      {children}
    </div>
  );
};

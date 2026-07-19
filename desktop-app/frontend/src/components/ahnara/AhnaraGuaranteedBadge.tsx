"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface AhnaraGuaranteedBadgeProps {
  className?: string;
  showText?: boolean;
}

export const AhnaraGuaranteedBadge: React.FC<AhnaraGuaranteedBadgeProps> = ({ 
  className, 
  showText = true 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative flex items-center gap-1.5 px-3 py-1 rounded-full overflow-hidden",
        "bg-ahnara-amber/10 border border-ahnara-amber/20",
        className
      )}
    >
      <ShieldCheck className="w-4 h-4 text-ahnara-amber" />
      {showText && (
        <span className="text-[10px] font-extrabold text-ahnara-amber uppercase tracking-wider relative z-10">
          AhnaraGuaranteed
        </span>
      )}
      
      {/* Shimmer Effect */}
      <motion.div
        animate={{
          x: ["-100%", "200%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "linear",
          repeatDelay: 1,
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 -z-0 pointer-events-none"
      />
    </motion.div>
  );
};

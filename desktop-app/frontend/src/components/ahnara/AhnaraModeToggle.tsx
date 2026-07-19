"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Store } from "lucide-react";
import { cn } from "@/lib/utils";

export type AhnaraMode = "buyer" | "seller";

interface AhnaraModeToggleProps {
  mode: AhnaraMode;
  onChange: (mode: AhnaraMode) => void;
  className?: string;
}

export const AhnaraModeToggle = ({ mode, onChange, className }: AhnaraModeToggleProps) => {
  return (
    <div
      className={cn(
        "relative liquid-glass p-1 rounded-full flex items-center gap-1 min-w-[140px] md:min-w-[160px] cursor-pointer",
        className
      )}
    >
      {/* Background Active Indicator */}
      <motion.div
        layoutId="mode-pill"
        className={cn(
          "absolute inset-y-1 rounded-full z-0 shadow-lg",
          mode === "buyer" ? "bg-ahnara-brand" : "bg-ahnara-accent"
        )}
        initial={false}
        animate={{
          left: mode === "buyer" ? "4px" : "calc(50% + 2px)",
          right: mode === "buyer" ? "calc(50% + 2px)" : "4px",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />

      {/* Buyer Side */}
      <div
        onClick={() => onChange("buyer")}
        className={cn(
          "relative z-10 flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-full transition-colors duration-200",
          mode === "buyer" ? "text-white" : "text-ahnara-text-faint hover:text-ahnara-text-secondary"
        )}
      >
        <ShoppingBag className="w-3.5 h-3.5" />
        <span className="text-xs font-bold uppercase tracking-wider">Buyer</span>
      </div>

      {/* Seller Side */}
      <div
        onClick={() => onChange("seller")}
        className={cn(
          "relative z-10 flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-full transition-colors duration-200",
          mode === "seller" ? "text-white" : "text-ahnara-text-faint hover:text-ahnara-text-secondary"
        )}
      >
        <Store className="w-3.5 h-3.5" />
        <span className="text-xs font-bold uppercase tracking-wider">Seller</span>
      </div>
    </div>
  );
};

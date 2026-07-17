"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { motion, HTMLMotionProps } from "framer-motion";

interface AhnaraChipProps extends Omit<HTMLMotionProps<"div">, "onSelect"> {
  label: string;
  icon?: React.ReactNode;
  onDismiss?: () => void;
  onSelect?: () => void;
  selected?: boolean;
}

export const AhnaraChip = ({
  label,
  icon,
  onDismiss,
  onSelect,
  selected,
  className,
  ...props
}: AhnaraChipProps) => {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium cursor-pointer transition-all duration-200",
        selected
          ? "bg-blue-600 text-white shadow-md shadow-ahnara-brand-glow"
          : "liquid-glass text-ahnara-text-secondary hover:text-ahnara-text-primary",
        className
      )}
      {...props}
    >
      {icon && <span className="w-3.5 h-3.5">{icon}</span>}
      <span>{label}</span>
      {onDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="p-0.5 hover:bg-white/20 rounded-full"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
};

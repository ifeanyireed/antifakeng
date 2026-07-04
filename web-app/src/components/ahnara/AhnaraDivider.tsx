"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AhnaraDividerProps {
  label?: string;
  className?: string;
}

export const AhnaraDivider = ({ label, className }: AhnaraDividerProps) => {
  return (
    <div className={cn("relative flex items-center w-full my-6", className)}>
      <div className="flex-1 h-px bg-ahnara-border" />
      {label && (
        <span className="mx-4 text-xs font-semibold text-ahnara-text-faint uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-ahnara-border" />
    </div>
  );
};

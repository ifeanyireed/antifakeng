"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AhnaraAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  isOnline?: boolean;
  className?: string;
}

export const AhnaraAvatar = ({ src, alt, fallback, name, size = "md", isOnline, className }: AhnaraAvatarProps) => {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const statusSizes = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-4 h-4",
  };

  const displayFallback = fallback || name || "NG";

  const getDeterministicAvatar = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = (Math.abs(hash) % 20) + 1;
    return `/character${index}.jpg`;
  };

  const avatarSrc = src || getDeterministicAvatar(displayFallback);

  return (
    <div className={cn("relative inline-block", className)}>
      <div
        className={cn(
          "rounded-full overflow-hidden border border-ahnara-border bg-gradient-to-br from-ahnara-brand-light to-ahnara-brand/10 flex items-center justify-center text-ahnara-brand font-bold uppercase",
          sizes[size]
        )}
      >
        <img src={avatarSrc} alt={alt || displayFallback} className="w-full h-full object-cover" />
      </div>
      
      {isOnline && (
        <div className={cn("absolute bottom-0 right-0", statusSizes[size])}>
          <div className="absolute inset-0 bg-ahnara-accent rounded-full animate-ping" />
          <div className="relative w-full h-full bg-ahnara-accent rounded-full border border-ahnara-bg-surface" />
        </div>
      )}
    </div>
  );
};

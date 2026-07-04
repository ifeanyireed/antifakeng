"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AhnaraRatingProps {
  value: number;
  max?: number;
  readonly?: boolean;
  onChange?: (value: number) => void;
}

export const AhnaraRating = ({ value, max = 5, readonly = true, onChange }: AhnaraRatingProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const index = i + 1;
        const isFilled = index <= displayValue;
        const isHalf = !isFilled && index - 0.5 <= displayValue;

        return (
          <motion.button
            key={i}
            disabled={readonly}
            whileHover={!readonly ? { scale: 1.2, rotate: 15 } : undefined}
            whileTap={!readonly ? { scale: 0.9 } : undefined}
            onMouseEnter={() => !readonly && setHoverValue(index)}
            onMouseLeave={() => !readonly && setHoverValue(null)}
            onClick={() => !readonly && onChange?.(index)}
            className={cn(
              "p-0.5 transition-colors duration-200",
              readonly ? "cursor-default" : "cursor-pointer"
            )}
          >
            <div className="relative">
              <Star
                className={cn(
                  "w-4 h-4",
                  isFilled ? "fill-[#F59E0B] text-[#F59E0B]" : "text-ahnara-border"
                )}
              />
              {isHalf && (
                <div className="absolute inset-0 overflow-hidden w-1/2">
                  <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                </div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

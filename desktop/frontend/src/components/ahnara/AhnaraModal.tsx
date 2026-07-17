"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AhnaraModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  backdropClassName?: string;
}

export const AhnaraModal = ({ isOpen, onClose, title, children, className, backdropClassName }: AhnaraModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={cn("absolute inset-0 bg-ahnara-bg-base/40 backdrop-blur-md", backdropClassName)}
          />
          
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className={cn(
              "relative liquid-glass w-full max-w-lg rounded-2xl p-6 shadow-2xl",
              className
            )}
          >
            <div className="flex items-center justify-between mb-4">
              {title && <h3 className="text-xl font-bold text-display">{title}</h3>}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-ahnara-brand-light rounded-full text-ahnara-text-faint hover:text-ahnara-text-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

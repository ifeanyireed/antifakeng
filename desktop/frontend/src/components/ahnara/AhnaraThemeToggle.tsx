"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export const AhnaraThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative w-10 h-10 flex items-center justify-center rounded-lg liquid-glass overflow-hidden transition-all duration-300",
        "hover:bg-ahnara-brand-light dark:hover:bg-ahnara-brand-light/10"
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "light" ? (
          <motion.div
            key="sun"
            initial={{ rotate: -180, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 180, scale: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Sun className="w-5 h-5 text-ahnara-amber" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: -180, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 180, scale: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Moon className="w-5 h-5 text-ahnara-brand" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

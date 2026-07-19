"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AhnaraGuaranteeCardProps {
  className?: string;
}

export const AhnaraGuaranteeCard: React.FC<AhnaraGuaranteeCardProps> = ({ className }) => {
  const promises = [
    { icon: <ShieldCheck className="w-4 h-4" />, label: "Vetted Techs" },
    { icon: <CheckCircle2 className="w-4 h-4" />, label: "Quality Guaranteed" },
    { icon: <RotateCcw className="w-4 h-4" />, label: "Refund if Unsatisfied" },
  ];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        "liquid-glass p-6 rounded-2xl border-ahnara-amber/20 bg-ahnara-amber-light/5 dark:bg-ahnara-amber/5 relative overflow-hidden group",
        className
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-ahnara-amber/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-ahnara-amber/10 transition-all duration-500" />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-ahnara-amber/10 flex items-center justify-center text-ahnara-amber shadow-inner">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-extrabold text-display">Ahnara Guarantee</h4>
          <p className="text-[10px] font-bold text-ahnara-amber uppercase tracking-widest">AhnaraVerified Premium</p>
        </div>
      </div>

      <div className="space-y-4">
        {promises.map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-ahnara-amber/10 flex items-center justify-center text-ahnara-amber">
              {p.icon}
            </div>
            <span className="text-xs font-bold text-ahnara-text-secondary">{p.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-ahnara-amber/10">
        <p className="text-[10px] text-ahnara-text-muted leading-relaxed italic">
          "If you're not satisfied, we'll send another technician or refund you. No questions."
        </p>
      </div>

      {/* Decorative Border Trace */}
      <div className="absolute inset-0 border border-ahnara-amber/20 rounded-2xl pointer-events-none group-hover:border-ahnara-amber/40 transition-colors" />
    </motion.div>
  );
};

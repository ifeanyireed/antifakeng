"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Calendar as CalendarIcon, 
  CheckCircle2,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AhnaraButton } from "./AhnaraButton";
import { AhnaraCard } from "./AhnaraCard";
import { AhnaraInput } from "./AhnaraInput";

interface AddTimeOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddException: (exception: any) => void;
}

export function AddTimeOffModal({ isOpen, onClose, onAddException }: AddTimeOffModalProps) {
  const [step, setStep] = useState(1);
  const [exceptionData, setExceptionData] = useState({
    date: "",
    reason: "",
  });

  const handleSubmit = () => {
    onAddException({
      ...exceptionData,
    });
    setStep(2);
  };

  const handleClose = () => {
    setStep(1);
    setExceptionData({
      date: "",
      reason: "",
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-ahnara-bg-base rounded-[40px] shadow-2xl z-[110] overflow-hidden"
          >
            {/* HEADER */}
            <div className="p-6 border-b border-ahnara-border flex items-center justify-between bg-ahnara-bg-surface">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-ahnara-brand" />
                <h2 className="text-xl font-extrabold">Add Time Off</h2>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-ahnara-bg-base rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
               <AnimatePresence mode="wait">
                  {step === 1 && (
                     <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <AhnaraInput 
                           label="Date" 
                           placeholder="e.g. Dec 25, 2026"
                           value={exceptionData.date}
                           onChange={(e) => setExceptionData({ ...exceptionData, date: e.target.value })}
                           leftIcon={<CalendarIcon className="w-4 h-4" />}
                        />
                        <AhnaraInput 
                           label="Reason" 
                           placeholder="e.g. Personal Holiday"
                           value={exceptionData.reason}
                           onChange={(e) => setExceptionData({ ...exceptionData, reason: e.target.value })}
                        />

                        <AhnaraButton 
                           size="lg" 
                           className="w-full h-14 mt-4" 
                           disabled={!exceptionData.date || !exceptionData.reason}
                           onClick={handleSubmit}
                        >
                           Add Exception
                        </AhnaraButton>
                     </motion.div>
                  )}

                  {step === 2 && (
                     <motion.div key="step2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10 space-y-8">
                        <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                           <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div>
                           <h3 className="text-2xl font-extrabold mb-2">Time Off Added!</h3>
                           <p className="text-sm text-ahnara-text-secondary leading-relaxed max-w-xs mx-auto">
                              Your schedule has been updated for <strong>{exceptionData.date}</strong>. You will appear as closed on this day.
                           </p>
                        </div>
                        <AhnaraButton onClick={handleClose} className="w-full">Done</AhnaraButton>
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

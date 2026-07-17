"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Tag, 
  Clock, 
  ChevronRight, 
  CheckCircle2,
  AlertCircle,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AhnaraButton } from "./AhnaraButton";
import { AhnaraCard } from "./AhnaraCard";
import { AhnaraInput } from "./AhnaraInput";

interface CreateDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDeal: (deal: any) => void;
}

export function CreateDealModal({ isOpen, onClose, onAddDeal }: CreateDealModalProps) {
  const [step, setStep] = useState(1);
  const [dealData, setDealData] = useState({
    title: "",
    service: "Plumbing",
    discount: "20%",
    duration: "7 days",
  });

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    onAddDeal({
      ...dealData,
      id: `D-${Math.floor(Math.random() * 1000)}`,
      views: 0,
      clicks: 0,
      status: "active",
      expires: `${dealData.duration} left`
    });
    setStep(3);
  };

  const handleClose = () => {
    setStep(1);
    setDealData({
      title: "",
      service: "Plumbing",
      discount: "20%",
      duration: "7 days",
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-ahnara-bg-base rounded-[40px] shadow-2xl z-[110] overflow-hidden"
          >
            {/* HEADER */}
            <div className="p-6 border-b border-ahnara-border flex items-center justify-between bg-ahnara-bg-surface">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-ahnara-brand" />
                <h2 className="text-xl font-extrabold">Create New Deal</h2>
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
                           label="Deal Title" 
                           placeholder="e.g. 20% off Full House Painting"
                           value={dealData.title}
                           onChange={(e) => setDealData({ ...dealData, title: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-xs font-bold text-ahnara-text-faint uppercase tracking-widest ml-1">Service / Product</label>
                              <select 
                                 className="w-full h-12 bg-ahnara-bg-surface border border-ahnara-border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-ahnara-brand/20 transition-all text-sm"
                                 value={dealData.service}
                                 onChange={(e) => setDealData({ ...dealData, service: e.target.value })}
                              >
                                 <option>Plumbing</option>
                                 <option>Electrical</option>
                                 <option>Installation</option>
                                 <option>Painting</option>
                                 <option>General Repair</option>
                              </select>
                           </div>
                           <AhnaraInput 
                              label="Discount Value" 
                              placeholder="e.g. 20% or Free"
                              value={dealData.discount}
                              onChange={(e) => setDealData({ ...dealData, discount: e.target.value })}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-ahnara-text-faint uppercase tracking-widest ml-1">Duration</label>
                           <div className="grid grid-cols-3 gap-2">
                              {["3 days", "7 days", "14 days"].map(d => (
                                 <button
                                    key={d}
                                    onClick={() => setDealData({ ...dealData, duration: d })}
                                    className={cn(
                                       "py-3 rounded-xl border text-xs font-bold transition-all",
                                       dealData.duration === d 
                                          ? "border-ahnara-brand bg-ahnara-brand/5 text-ahnara-brand" 
                                          : "border-ahnara-border bg-ahnara-bg-surface hover:border-ahnara-brand/30"
                                    )}
                                 >
                                    {d}
                                 </button>
                              ))}
                           </div>
                        </div>

                        <AhnaraButton 
                           size="lg" 
                           className="w-full h-14 mt-4" 
                           disabled={!dealData.title}
                           onClick={handleNext}
                        >
                           Continue
                        </AhnaraButton>
                     </motion.div>
                  )}

                  {step === 2 && (
                     <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                        <AhnaraCard variant="glass" className="p-6 bg-ahnara-brand/5 border-ahnara-brand/20">
                           <h4 className="text-xs font-bold text-ahnara-text-faint uppercase tracking-widest mb-4">Deal Preview</h4>
                           <div className="space-y-3">
                              <h3 className="text-lg font-bold">{dealData.title}</h3>
                              <p className="text-sm text-ahnara-text-secondary">{dealData.service} • {dealData.discount} Discount</p>
                              <div className="flex items-center gap-2 pt-4 border-t border-ahnara-border/30">
                                 <Clock className="w-4 h-4 text-amber-500" />
                                 <span className="text-xs font-bold">Valid for {dealData.duration} from activation</span>
                              </div>
                           </div>
                        </AhnaraCard>

                        <div className="space-y-4">
                           <p className="text-xs text-ahnara-text-secondary leading-relaxed">
                              This deal will be published to the <span className="font-bold">Handyman Hub</span> and featured on your profile. You can end it at any time.
                           </p>
                           <div className="flex gap-4">
                              <AhnaraButton variant="secondary" className="flex-1" onClick={handleBack}>Back</AhnaraButton>
                              <AhnaraButton className="flex-2" onClick={handleSubmit}>Publish Deal</AhnaraButton>
                           </div>
                        </div>
                     </motion.div>
                  )}

                  {step === 3 && (
                     <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10 space-y-8">
                        <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                           <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div>
                           <h3 className="text-2xl font-extrabold mb-2">Deal Published!</h3>
                           <p className="text-sm text-ahnara-text-secondary leading-relaxed max-w-xs mx-auto">
                              Your new deal is now live. Expect an increase in profile views and clicks soon.
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

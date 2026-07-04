"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  User, 
  Phone, 
  Zap, 
  TrendingUp,
  CheckCircle2,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AhnaraButton } from "./AhnaraButton";
import { AhnaraCard } from "./AhnaraCard";
import { AhnaraInput } from "./AhnaraInput";

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (lead: any) => void;
}

export function AddLeadModal({ isOpen, onClose, onAddLead }: AddLeadModalProps) {
  const [step, setStep] = useState(1);
  const [leadData, setLeadData] = useState({
    name: "",
    phone: "",
    service: "Plumbing Installation",
    value: "₦25,000",
  });

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
  };

  const handleSubmit = () => {
    onAddLead({
      ...leadData,
      id: `L-${Math.floor(Math.random() * 1000)}`,
      date: "Just now",
      column: "new"
    });
    setStep(2);
  };

  const handleClose = () => {
    setStep(1);
    setLeadData({
      name: "",
      phone: "",
      service: "Plumbing Installation",
      value: "₦25,000",
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
                <User className="w-5 h-5 text-ahnara-brand" />
                <h2 className="text-xl font-extrabold">Add New Lead</h2>
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
                           label="Customer Name" 
                           placeholder="e.g. Chidi Okafor"
                           value={leadData.name}
                           onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                           leftIcon={<User className="w-4 h-4" />}
                        />
                        <AhnaraInput 
                           label="Phone Number" 
                           placeholder="e.g. +234 803 000 0000"
                           value={leadData.phone}
                           onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                           leftIcon={<Phone className="w-4 h-4" />}
                        />
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-ahnara-text-faint uppercase tracking-widest ml-1">Service Interest</label>
                           <select 
                              className="w-full h-12 bg-ahnara-bg-surface border border-ahnara-border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-ahnara-brand/20 transition-all text-sm"
                              value={leadData.service}
                              onChange={(e) => setLeadData({ ...leadData, service: e.target.value })}
                           >
                              <option>Plumbing Installation</option>
                              <option>Repair & Maintenance</option>
                              <option>Emergency Service</option>
                              <option>Consultation</option>
                           </select>
                        </div>
                        <AhnaraInput 
                           label="Estimated Value" 
                           placeholder="e.g. ₦25,000"
                           value={leadData.value}
                           onChange={(e) => setLeadData({ ...leadData, value: e.target.value })}
                           leftIcon={<TrendingUp className="w-4 h-4" />}
                        />

                        <AhnaraButton 
                           size="lg" 
                           className="w-full h-14 mt-4" 
                           disabled={!leadData.name || !leadData.phone}
                           onClick={handleSubmit}
                        >
                           Add to CRM
                        </AhnaraButton>
                     </motion.div>
                  )}

                  {step === 2 && (
                     <motion.div key="step2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10 space-y-8">
                        <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                           <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div>
                           <h3 className="text-2xl font-extrabold mb-2">Lead Added!</h3>
                           <p className="text-sm text-ahnara-text-secondary leading-relaxed max-w-xs mx-auto">
                              <strong>{leadData.name}</strong> has been added to your "New Leads" column. Time to reach out!
                           </p>
                        </div>
                        <AhnaraButton onClick={handleClose} className="w-full">Back to CRM</AhnaraButton>
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

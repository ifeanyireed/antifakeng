"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AhnaraButton } from "./AhnaraButton";
import { AhnaraCard } from "./AhnaraCard";
import { AhnaraBadge } from "./AhnaraBadge";
import { AhnaraVerifiedBadge } from "./AhnaraVerifiedBadge";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  serviceName?: string;
  proProfileId?: string;
  initialDate?: Date;
  initialTime?: string;
}

export function BookingModal({ isOpen, onClose, businessName, serviceName, proProfileId, initialDate, initialTime }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isAhnaraVerified, setIsAhnaraVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [proAvailability, setProAvailability] = React.useState<Record<string, string[]>>({});

  React.useEffect(() => {
    if (isOpen && proProfileId) {
      const fetchProDetails = async () => {
        try {
          const proData = await api.get(`/discovery/pros/${proProfileId}`);
          if (proData && proData.availability) {
            const parsed = JSON.parse(proData.availability);
            setProAvailability(parsed);
          } else {
            setProAvailability({});
          }
        } catch (err) {
          console.error("Failed to load pro availability details:", err);
        }
      };
      fetchProDetails();
    }
  }, [isOpen, proProfileId]);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      day: days[d.getDay()],
      date: d.getDate(),
      full: d
    };
  });

  const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"];

  const getAvailableTimeSlots = () => {
    if (selectedDate === null) return [];
    const dateObj = dates[selectedDate].full;
    const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = weekdayNames[dateObj.getDay()];
    
    const proSlots = proAvailability[dayName];
    if (proSlots && proSlots.length > 0) {
      return proSlots;
    }
    
    const hasConfigured = Object.values(proAvailability).some(slots => slots && slots.length > 0);
    if (!hasConfigured) {
      return timeSlots;
    }
    return [];
  };

  React.useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        const index = dates.findIndex(d => 
          d.full.getFullYear() === initialDate.getFullYear() &&
          d.full.getMonth() === initialDate.getMonth() &&
          d.full.getDate() === initialDate.getDate()
        );
        if (index !== -1) {
          setSelectedDate(index);
        }
      }
      if (initialTime) {
        setSelectedTime(initialTime);
      }
    }
  }, [isOpen, initialDate, initialTime]);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleConfirmBooking = async () => {
    if (!proProfileId || selectedDate === null || !selectedTime) return;
    
    setLoading(true);
    setError("");
    
    try {
      const scheduledAt = new Date(dates[selectedDate].full);
      const [time, period] = selectedTime.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      scheduledAt.setHours(hours, minutes, 0, 0);

      const amount = isAhnaraVerified ? 5000 : 0;
      const type = isAhnaraVerified ? "PREMIUM" : "STANDARD";
      
      router.push(`/checkout?proId=${proProfileId}&service=${encodeURIComponent(serviceName || "Standard Consultation")}&amount=${amount}&type=${type}&date=${scheduledAt.toISOString()}`);
    } catch (err: any) {
      setError(err.message || "Failed to create booking. Are you logged in?");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedDate(null);
    setSelectedTime(null);
    setIsAhnaraVerified(false);
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center lg:p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ y: "100%", opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: "100%", opacity: 0 }}
            className="relative w-full lg:max-w-2xl bg-ahnara-bg-base rounded-t-[32px] lg:rounded-[40px] shadow-2xl z-[110] overflow-hidden max-h-[95vh] lg:max-h-[90vh] flex flex-col"
          >
            {/* HEADER */}
            <div className="p-6 border-b border-ahnara-border flex items-center justify-between bg-ahnara-bg-surface flex-shrink-0">
              <div className="flex items-center gap-3">
                {step > 1 && step < 4 && (
                  <button onClick={handleBack} className="p-2 hover:bg-ahnara-bg-base rounded-xl transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                   <h2 className="text-xl font-extrabold">Book Service</h2>
                   <p className="text-[10px] text-ahnara-text-faint font-bold uppercase tracking-widest">{businessName}</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-ahnara-bg-base rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto no-scrollbar">
               {error && (
                 <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-3">
                   <AlertCircle className="w-4 h-4" />
                   {error}
                 </div>
               )}

               <AnimatePresence mode="wait">
                  {step === 1 && (
                     <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                        <div>
                           <h3 className="text-sm font-bold uppercase tracking-widest text-ahnara-text-faint mb-4">Select Date</h3>
                           <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                              {dates.map((d, i) => (
                                 <button
                                    key={i}
                                    onClick={() => setSelectedDate(i)}
                                    className={cn(
                                       "flex flex-col items-center justify-center min-w-[70px] h-24 rounded-2xl border-2 transition-all",
                                       selectedDate === i 
                                          ? "border-ahnara-brand bg-ahnara-brand/5 shadow-lg shadow-ahnara-brand/10" 
                                          : "border-ahnara-border bg-ahnara-bg-surface hover:border-ahnara-brand/30"
                                    )}
                                 >
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">{d.day}</span>
                                    <span className="text-xl font-extrabold">{d.date}</span>
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div>
                           <h3 className="text-sm font-bold uppercase tracking-widest text-ahnara-text-faint mb-4">Select Time</h3>
                           {getAvailableTimeSlots().length === 0 ? (
                              <div className="py-6 text-center text-ahnara-text-faint text-xs bg-ahnara-bg-surface border border-ahnara-border border-dashed rounded-2xl">
                                 No available working slots on this day.
                              </div>
                           ) : (
                              <div className="grid grid-cols-3 gap-3">
                                 {getAvailableTimeSlots().map((time) => (
                                    <button
                                       key={time}
                                       onClick={() => setSelectedTime(time)}
                                       className={cn(
                                          "py-3 rounded-xl border-2 text-xs font-bold transition-all",
                                          selectedTime === time 
                                             ? "border-ahnara-brand bg-ahnara-brand/5 text-ahnara-brand" 
                                             : "border-ahnara-border bg-ahnara-bg-surface hover:border-ahnara-brand/30"
                                       )}
                                    >
                                       {time}
                                    </button>
                                 ))}
                              </div>
                           )}
                        </div>

                        <AhnaraButton 
                           size="lg" 
                           className="w-full h-14" 
                           disabled={selectedDate === null || selectedTime === null}
                           onClick={handleNext}
                           rightIcon={<ChevronRight className="w-5 h-5" />}
                        >
                           Continue
                        </AhnaraButton>
                     </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8">
                      <div className="text-center space-y-2">
                        <div className="flex justify-center mb-4">
                          <AhnaraVerifiedBadge />
                        </div>
                        <h3 className="text-2xl font-extrabold text-display">Upgrade your booking?</h3>
                        <p className="text-sm text-ahnara-text-secondary max-w-xs mx-auto">Choose standard or get a AhnaraVerified professional for maximum peace of mind.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                          onClick={() => { setIsAhnaraVerified(false); handleNext(); }}
                          className="liquid-glass p-6 rounded-[32px] border-ahnara-border hover:border-ahnara-brand/30 transition-all text-left group"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-ahnara-bg-base flex items-center justify-center mb-4 text-ahnara-text-faint group-hover:scale-110 transition-transform">
                            <Clock className="w-6 h-6" />
                          </div>
                          <h4 className="font-bold text-lg mb-1">Standard</h4>
                          <p className="text-xs text-ahnara-text-faint mb-4">Book with {businessName} directly.</p>
                          <p className="text-lg font-extrabold text-ahnara-text-primary">₦0.00 <span className="text-xs font-bold text-ahnara-text-faint">extra</span></p>
                        </button>

                        <button 
                          onClick={() => { setIsAhnaraVerified(true); handleNext(); }}
                          className="liquid-glass p-6 rounded-[32px] border-ahnara-amber/40 bg-ahnara-amber/5 relative overflow-hidden group text-left"
                        >
                          <motion.div
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-ahnara-amber/10 to-transparent skew-x-12"
                          />
                          <div className="absolute top-4 right-4">
                             <AhnaraBadge variant="secondary" className="bg-ahnara-amber text-white border-none text-[8px]">RECOMMENDED</AhnaraBadge>
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-ahnara-amber/20 flex items-center justify-center mb-4 text-ahnara-amber group-hover:scale-110 transition-transform relative z-10">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                          <h4 className="font-bold text-lg mb-1 relative z-10">AhnaraVerified</h4>
                          <p className="text-xs text-ahnara-amber/80 font-bold mb-4 relative z-10">Vetted Ahnara Technician dispatched by us.</p>
                          <p className="text-lg font-extrabold text-ahnara-amber relative z-10">+₦5,000 <span className="text-xs font-bold opacity-60">premium</span></p>
                        </button>
                      </div>

                      <button onClick={handleNext} className="w-full text-xs font-bold text-ahnara-text-faint uppercase tracking-widest hover:text-ahnara-text-secondary transition-colors">
                        What is AhnaraVerified?
                      </button>
                    </motion.div>
                  )}

                  {step === 3 && (
                     <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                        <AhnaraCard variant="glass" className={cn("p-6 border-ahnara-brand/20 bg-ahnara-brand/5", isAhnaraVerified && "border-ahnara-amber/30 bg-ahnara-amber/5")}>
                           <div className="flex justify-between items-center mb-4">
                              <h4 className="text-xs font-bold text-ahnara-text-faint uppercase tracking-widest">Booking Details</h4>
                              {isAhnaraVerified && <AhnaraVerifiedBadge showText={false} />}
                           </div>
                           <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                 <span className="text-sm font-medium text-ahnara-text-secondary">Service</span>
                                 <span className="text-sm font-bold">{serviceName || "Standard Consultation"}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-sm font-medium text-ahnara-text-secondary">Tier</span>
                                 <span className={cn("text-sm font-bold", isAhnaraVerified ? "text-ahnara-amber" : "text-ahnara-brand")}>
                                    {isAhnaraVerified ? "AhnaraVerified Premium" : "Standard Booking"}
                                 </span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-sm font-medium text-ahnara-text-secondary">Date</span>
                                 <span className="text-sm font-bold">{dates[selectedDate!].day}, {dates[selectedDate!].date}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-sm font-medium text-ahnara-text-secondary">Time</span>
                                 <span className="text-sm font-bold">{selectedTime}</span>
                              </div>
                           </div>
                        </AhnaraCard>

                        <div className="space-y-4">
                           <p className="text-xs text-ahnara-text-secondary leading-relaxed">
                              {isAhnaraVerified 
                                ? "AhnaraVerified jobs require a deposit to secure your professional. Protected by Ahnara Guarantee."
                                : "By confirming, you agree to the seller's cancellation policy. No payment is required upfront."}
                           </p>
                           {isAhnaraVerified ? (
                              <Link href={`/checkout?proId=${proProfileId}&service=${serviceName || "Premium Service"}&date=${dates[selectedDate!].full.toISOString()}&time=${selectedTime}&type=AHNARA_VERIFIED&amount=5000`}>
                                 <AhnaraButton size="lg" className="w-full h-14 bg-ahnara-amber hover:bg-ahnara-amber/90">
                                    Proceed to Checkout
                                 </AhnaraButton>
                              </Link>
                           ) : (
                              <AhnaraButton size="lg" className="w-full h-14" onClick={handleConfirmBooking} isLoading={loading}>
                                 Confirm Booking
                              </AhnaraButton>
                           )}
                        </div>

                        <div className="flex items-center gap-2 justify-center py-2">
                           <ShieldCheck className="w-4 h-4 text-emerald-500" />
                           <span className="text-[10px] font-bold text-ahnara-text-faint uppercase tracking-widest">Ahnara Secure Booking</span>
                        </div>
                     </motion.div>
                  )}

                  {step === 4 && (
                     <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10 space-y-8">
                        <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                           <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div>
                           <h3 className="text-2xl font-extrabold mb-2">Booking Requested!</h3>
                           <p className="text-sm text-ahnara-text-secondary leading-relaxed max-w-xs mx-auto">
                              Your request has been sent to <strong>{businessName}</strong>. You'll be notified once they confirm.
                           </p>
                        </div>
                        <div className="flex flex-col gap-3">
                           <AhnaraButton variant="secondary" onClick={handleClose}>Back to Profile</AhnaraButton>
                           <Link href="/dashboard" className="w-full" onClick={handleClose}>
                              <AhnaraButton className="w-full">View My Dashboard</AhnaraButton>
                           </Link>
                        </div>
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

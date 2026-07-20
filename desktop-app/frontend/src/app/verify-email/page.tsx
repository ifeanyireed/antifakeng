"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  IconArrowLeft, 
  IconRotateClockwise2, 
  IconCheck, 
  IconAlertCircle, 
  IconCircleCheck 
} from "@tabler/icons-react";
import { useAuth } from "@/components/ahnara/AuthContext";
import { AhnaraCard } from "@/components/ahnara/AhnaraCard";
import { AhnaraButton } from "@/components/ahnara/AhnaraButton";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://antifake.ng").replace(/\/$/, "");

export default function VerifyEmailPage() {
  const router = useRouter();
  const { logout } = useAuth();
  
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    const storedEmail = localStorage.getItem("verify_email_address") || "";
    if (!storedEmail) {
      setError("No registration email found. Please sign up or log in.");
    } else {
      setEmail(storedEmail);
    }
  }, []);

  // Resend countdown timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/email/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setSuccess("Email verified successfully! Redirecting to onboarding...");
        // Clear verify email from storage
        localStorage.removeItem("verify_email_address");
        setTimeout(() => {
          router.push("/onboarding");
        }, 1500);
      } else {
        setError(data.error || "Verification failed. Please check the code and try again.");
      }
    } catch (err) {
      setLoading(false);
      setError("Connection to authorization service failed.");
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/email/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      setResending(false);
      if (res.ok) {
        setSuccess("A new verification code has been sent to your email.");
        setTimer(60);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to resend verification email.");
      }
    } catch (err) {
      setResending(false);
      setError("Failed to reach email service.");
    }
  };

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#D4F475]/30 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#0089C1]/10 rounded-full filter blur-3xl pointer-events-none" />

      {/* Main card wrapper */}
      <div className="w-full max-w-md z-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <AhnaraCard variant="flat" className="bg-white/85 backdrop-blur-md border border-slate-200/80 p-8 shadow-2xl rounded-3xl flex flex-col gap-6">
            
            {/* Logo & Header */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex items-center justify-center mb-2">
                <img src="/logo.png" alt="AntiFakeNG Logo" className="w-12 h-12 object-contain" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-800 text-display">Verify Email</h2>
              <p className="text-xs text-slate-400 font-semibold px-4">
                We sent a 6-digit confirmation code to <span className="text-[#0089C1] font-bold">{email || "your address"}</span>.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleVerify} className="flex flex-col gap-5">
              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
                  <IconAlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
                  <IconCircleCheck className="w-4 h-4 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div className="flex flex-col gap-2 w-full">
                <label htmlFor="otp-code" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">
                  Verification Code
                </label>
                <input
                  id="otp-code"
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="0 0 0 0 0 0"
                  className="w-full h-12 bg-white/50 border border-slate-200 rounded-xl text-center text-lg font-mono font-bold tracking-[0.75em] text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#0089C1] focus:bg-white transition-all shadow-sm pl-[0.75em]"
                  required
                />
              </div>

              <AhnaraButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full bg-[#1E293B] text-white hover:bg-slate-800 rounded-xl mt-1"
                isLoading={loading}
                disabled={!email}
              >
                Verify & Continue
              </AhnaraButton>
            </form>

            <div className="flex flex-col items-center gap-4 text-xs font-semibold border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between w-full">
                <span className="text-slate-400">Didn't receive the code?</span>
                <button
                  onClick={handleResend}
                  disabled={timer > 0 || resending || !email}
                  className="text-[#0089C1] hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-all font-bold"
                >
                  <IconRotateClockwise2 className="w-4 h-4" />
                  {timer > 0 ? `Resend in ${timer}s` : "Resend Code"}
                </button>
              </div>

              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="text-[#0089C1] hover:underline flex items-center gap-1 mt-2 transition-all font-bold self-start"
              >
                <IconArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </div>
          </AhnaraCard>
        </motion.div>
      </div>
    </div>
  );
}

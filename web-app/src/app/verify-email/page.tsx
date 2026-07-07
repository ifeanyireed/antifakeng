"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { IconMail, IconArrowLeft, IconRotateClockwise2, IconCheck } from "@tabler/icons-react";
import { useAuth } from "@/components/ahnara/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-[#8BB436]/10 border border-[#8BB436]/20 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
            <Image src="/logo.png" alt="AntiFakeNG" width={40} height={40} className="object-contain" />
          </div>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white font-serif">
          Verify Your Email
        </h2>
        <p className="mt-2 text-sm text-slate-400 font-medium px-4">
          We sent a 6-digit confirmation code to <span className="text-white font-bold">{email || "your address"}</span>.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 py-8 px-4 shadow-xl rounded-3xl sm:px-10"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <IconCheck className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label htmlFor="otp-code" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Verification Code
              </label>
              <div className="relative">
                <input
                  id="otp-code"
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit code"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl py-3.5 px-4 text-lg font-mono font-bold tracking-widest text-center text-white placeholder-slate-600 focus:outline-none focus:border-[#8BB436] focus:bg-slate-900 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <button
                id="btn-submit"
                type="submit"
                disabled={loading || !email}
                className="w-full bg-[#8BB436] text-white hover:bg-[#729c25] disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3.5 px-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#8BB436]/10"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Continue
                    <IconCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-col items-center gap-4 text-xs font-semibold border-t border-slate-700/50 pt-6">
            <div className="flex items-center justify-between w-full">
              <span className="text-slate-400">Didn't receive the code?</span>
              <button
                onClick={handleResend}
                disabled={timer > 0 || resending || !email}
                className="text-[#8BB436] hover:text-[#729c25] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
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
              className="text-slate-500 hover:text-slate-300 flex items-center gap-1 mt-2 transition-all self-start"
            >
              <IconArrowLeft className="w-4 h-4" />
              Back to Registration
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

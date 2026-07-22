"use client";

import React, { useState } from "react";
import Link from "next/link";
import { IconTrash, IconCheck, IconAlertCircle, IconLoader } from "@tabler/icons-react";

export default function DeleteUserData() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;

    setIsSubmitting(true);
    setStatus("idle");
    setMessage("");

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${API_BASE}/api/analytics/users/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.error || "An error occurred while processing your request.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Failed to connect to the server. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-slate-800 font-sans flex flex-col overflow-x-hidden">
      
      {/* NAVBAR */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-50 sticky top-0 bg-[#E8EFF4]/90 backdrop-blur-md border-b border-slate-300/20">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <img src="/logo.png" alt="AntiFakeNG Logo" className="w-10 h-10 object-contain" />
            <span className="font-extrabold text-xl tracking-tight text-slate-900 text-display">AntiFakeNG</span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/">
            <span className="text-sm font-bold text-slate-600 hover:text-slate-900 cursor-pointer transition-colors">Home</span>
          </Link>
          <Link href="/support">
            <span className="text-sm font-bold text-slate-600 hover:text-slate-900 cursor-pointer transition-colors">Help Center</span>
          </Link>
        </div>
      </header>

      {/* CONTENT HERO */}
      <section className="w-full max-w-3xl mx-auto px-6 py-12 flex-grow">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200/30 flex flex-col gap-8">
          <div>
            <span className="text-[10px] font-black text-red-600 uppercase tracking-wider block mb-2">GDPR & Meta Compliance Portal</span>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Request User Data Deletion</h1>
            <p className="text-sm text-slate-500 mt-2">
              Enter the phone number you bound to your AntiFakeNG product verification scan session. We will permanently erase your phone hashes, unlinking all session tracking and deleting any associated report logs.
            </p>
          </div>

          <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 text-sm mb-2">🔒 What data is deleted?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              When you submit a request, our database deletes the SHA-256 hash of your phone number from the consumer index. All historical verification sessions are anonymized (leaving only general analytics like time and location, but unlinked from your identity). Any pending support chat tickets or counterfeit reports containing this phone number are permanently purged.
            </p>
          </div>

          {status === "success" ? (
            <div className="bg-emerald-50 border border-emerald-200/60 text-emerald-800 rounded-2xl p-6 flex items-start gap-4">
              <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl mt-0.5">
                <IconCheck className="w-6 h-6" />
              </span>
              <div>
                <h4 className="font-bold text-sm text-emerald-900">Data Deleted Successfully</h4>
                <p className="text-xs mt-1 text-emerald-700/90 leading-relaxed">{message}</p>
                <button 
                  onClick={() => { setStatus("idle"); setPhoneNumber(""); }}
                  className="mt-4 text-xs font-black uppercase tracking-wider text-emerald-800 hover:text-emerald-950 transition-colors"
                >
                  Submit another request
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="phone" className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  Linked Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold select-none">
                    +
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="2348067028859"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-3 pl-8 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-ahnara-brand focus:bg-white"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Provide your country prefix (e.g. 234 for Nigeria) with no spaces or symbols.
                </p>
              </div>

              {status === "error" && (
                <div className="bg-red-50 border border-red-200/60 text-red-800 rounded-xl p-4 flex items-center gap-3">
                  <IconAlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span className="text-xs font-semibold">{message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !phoneNumber}
                className="w-full sm:w-auto self-start bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <IconLoader className="w-4 h-4 animate-spin" />
                    <span>Processing Request...</span>
                  </>
                ) : (
                  <>
                    <IconTrash className="w-4 h-4" />
                    <span>Erase My Data</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-300/20 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto">
        <p>© 2026 AntiFakeNG Authenticity Platform. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/privacy-policy">
            <span className="hover:text-slate-800 cursor-pointer transition-colors">Privacy Policy</span>
          </Link>
          <Link href="/terms-of-service">
            <span className="hover:text-slate-800 cursor-pointer transition-colors">Terms of Service</span>
          </Link>
        </div>
      </footer>

    </div>
  );
}

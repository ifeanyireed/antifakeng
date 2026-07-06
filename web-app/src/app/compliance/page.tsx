"use client";

import React from "react";
import Link from "next/link";

export default function CompliancePosture() {
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
      <section className="w-full max-w-4xl mx-auto px-6 py-12 flex-grow">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200/30">
          <span className="text-[10px] font-black text-[#0089C1] uppercase tracking-wider block mb-2">Platform Verification Standards</span>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 tracking-tight">Compliance & Cryptographic Posture</h1>
          <p className="text-xs text-slate-400 mb-8">Last Updated: July 6, 2026</p>

          <div className="prose prose-slate text-sm leading-relaxed text-slate-600 flex flex-col gap-6">
            
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">1. Cryptographic Token Security</h2>
              <p>
                Each serial token (formatted as XXXX-XXXX) is generated using secure cryptographically strong pseudo-random number generators (CSPRNG). We perform automated database collision checks during batch generation to guarantee absolute token uniqueness.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">2. Double-Scan Detection Compliance</h2>
              <p>
                To prevent counterfeits from replicating a single valid QR code across multiple fake products, our verification logic logs scan timestamps and session geo-IP hashes. If a code is scanned across multiple distinct devices or channels within a specific timeframe, it is flagged as SUSPICIOUS to prevent label copying.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">3. WhatsApp & SMS OTP Gateway Standards</h2>
              <p>
                Verification session bindings utilize whatsmeow for secure, end-to-end encrypted pairing on startup. Daily self-healing status checks automatically verify gateway connectivity. Fallback SMS routes utilize Termii API with ResultsPRO sender ID mappings.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">4. Database & Remote Server Security</h2>
              <p>
                Our remote Hostinger MySQL databases are protected behind secure network firewalls. We enforce SSL encryption on all database client connection nodes to guarantee that data packets containing token and brand registrations are protected from eavesdropping.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">5. NDA Regulatory Compliance</h2>
              <p>
                AntiFakeNG operates in strict compliance with the Nigeria Data Protection Regulation (NDPR) and international data privacy benchmarks. We maintain zero permanent records of unhashed consumer identities.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-300/20 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto">
        <p>© 2026 AntiFakeNG Authenticity Platform. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/terms">
            <span className="hover:text-slate-800 cursor-pointer transition-colors">Terms of Service</span>
          </Link>
          <Link href="/privacy">
            <span className="hover:text-slate-800 cursor-pointer transition-colors">Privacy Policy</span>
          </Link>
        </div>
      </footer>

    </div>
  );
}

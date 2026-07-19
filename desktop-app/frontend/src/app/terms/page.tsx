"use client";

import React from "react";
import Link from "next/link";

export default function TermsOfService() {
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
          <span className="text-[10px] font-black text-[#0089C1] uppercase tracking-wider block mb-2">Legal Framework</span>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 tracking-tight">Terms of Service</h1>
          <p className="text-xs text-slate-400 mb-8">Last Updated: July 6, 2026</p>

          <div className="prose prose-slate text-sm leading-relaxed text-slate-600 flex flex-col gap-6">
            
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">1. Agreement to Terms</h2>
              <p>
                By accessing or using the AntiFakeNG product authenticity platform, you agree to comply with and be bound by these Terms of Service. If you do not agree, you are prohibited from utilizing our token generation, scanning, and verification services.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">2. Brand & Manufacturer Account Security</h2>
              <p>
                Manufacturers (Producers) must maintain the absolute confidentiality of their dashboard credentials. Any batch token generation, roll printing output, and cryptographic key configurations mapped under your account are your sole responsibility.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">3. Product Label Printing Rules</h2>
              <p>
                Producers are responsible for the physical security of printed QR code labels. Printed batch labels must follow our Roll Width specifications (enforcing a minimum of 2px padding and 1px spacing) to ensure accurate machine cutting. AntiFakeNG is not liable for verification failures caused by printed label degradation or physical cutting misalignments.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">4. Consumer Verification Bindings</h2>
              <p>
                Consumers utilizing the scanning portal agree to bind their scan queries with a valid phone number (via WhatsApp or SMS OTP). This process prevents duplicated scanning abuse and secures transaction logs. Verification verdicts (GENUINE, SUSPICIOUS, INVALID) are based on automated cryptographic checks.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">5. Service Limitations & Availability</h2>
              <p>
                AntiFakeNG runs automated self-healing scripts and status tests daily. However, we do not guarantee uninterrupted gateway service. Delivery of SMS or WhatsApp codes is subject to external cellular carrier routing and device connectivity limits.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">6. Governing Law</h2>
              <p>
                These terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to conflict of law principles.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-300/20 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto">
        <p>© 2026 AntiFakeNG Authenticity Platform. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/privacy">
            <span className="hover:text-slate-800 cursor-pointer transition-colors">Privacy Policy</span>
          </Link>
          <Link href="/compliance">
            <span className="hover:text-slate-800 cursor-pointer transition-colors">Compliance Posture</span>
          </Link>
        </div>
      </footer>

    </div>
  );
}

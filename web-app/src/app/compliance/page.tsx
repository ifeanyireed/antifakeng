"use client";

import React from "react";
import Link from "next/link";
import { IconShieldLock, IconKey, IconDatabase, IconFileText, IconDeviceMobile, IconTrash } from "@tabler/icons-react";

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
      <section className="w-full max-w-5xl mx-auto px-6 py-12 flex-grow flex flex-col gap-8">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200/30">
          <div className="flex items-center gap-4 mb-4">
            <span className="p-3 bg-[#0089C1]/10 text-[#0089C1] rounded-2xl">
              <IconShieldLock className="w-8 h-8" />
            </span>
            <div>
              <span className="text-[10px] font-black text-[#0089C1] uppercase tracking-wider block">Security Operations Posture</span>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Compliance & Cryptographic Standards</h1>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-8 border-b border-slate-100 pb-4">Last Updated: July 7, 2026</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1 */}
            <div className="border border-slate-100 bg-slate-50/30 rounded-2xl p-6 flex gap-4">
              <span className="p-2.5 bg-slate-100 text-slate-700 rounded-xl shrink-0 h-11">
                <IconKey className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">Cryptographic Token Security</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Product verification serials (formatted as 8-character hashes) are generated using secure cryptographically strong pseudo-random number generators (CSPRNG). Collision-free token distribution is guaranteed by automatic database constraint sweeps.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="border border-slate-100 bg-slate-50/30 rounded-2xl p-6 flex gap-4">
              <span className="p-2.5 bg-slate-100 text-slate-700 rounded-xl shrink-0 h-11">
                <IconDeviceMobile className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">Double-Scan Detection</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Our scanning backend evaluates velocity logs, device fingerprints, and geolocation-based anomalies. If a unique serial code is queried repeatedly across distinct geographic coordinates, the token triggers a counterfeit warning status.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="border border-slate-100 bg-slate-50/30 rounded-2xl p-6 flex gap-4">
              <span className="p-2.5 bg-slate-100 text-slate-700 rounded-xl shrink-0 h-11">
                <IconDatabase className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">Secure Database Clustering</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Databases are hosted in locked SQL servers with TLS 1.3 enforced for all query streams. Direct external access to database ports is strictly disabled; queries are mediated through a private gateway proxy to prevent remote injection attacks.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="border border-slate-100 bg-slate-50/30 rounded-2xl p-6 flex gap-4">
              <span className="p-2.5 bg-slate-100 text-slate-700 rounded-xl shrink-0 h-11">
                <IconFileText className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">NDPR & GDPR Compliance</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Consumer phone numbers are hashed using SHA-256 before write commits. We hold no unhashed personal identities, fulfilling the Nigeria Data Protection Regulation (NDPR) and international privacy requirements.
                </p>
              </div>
            </div>

          </div>

          {/* Privacy Portal Banner */}
          <div className="mt-8 bg-[#0089C1]/5 border border-[#0089C1]/10 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="p-2 bg-[#0089C1]/10 text-[#0089C1] rounded-xl shrink-0 mt-0.5 sm:mt-0">
                <IconTrash className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Self-Service Privacy Controls</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                  Request immediate deletion of your phone hashes and verification sessions via our compliance portal.
                </p>
              </div>
            </div>
            <Link href="/delete-user-data">
              <span className="bg-[#0089C1] hover:bg-[#00709e] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-colors cursor-pointer shrink-0">
                Access Privacy Portal
              </span>
            </Link>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-300/20 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto">
        <p>© 2026 AntiFakeNG Authenticity Platform. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/terms-of-service">
            <span className="hover:text-slate-800 cursor-pointer transition-colors">Terms of Service</span>
          </Link>
          <Link href="/privacy-policy">
            <span className="hover:text-slate-800 cursor-pointer transition-colors">Privacy Policy</span>
          </Link>
        </div>
      </footer>

    </div>
  );
}

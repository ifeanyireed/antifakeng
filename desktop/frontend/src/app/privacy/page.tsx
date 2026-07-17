"use client";

import React from "react";
import Link from "next/link";

export default function PrivacyPolicy() {
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
          <span className="text-[10px] font-black text-[#0089C1] uppercase tracking-wider block mb-2">Corporate Confidentiality</span>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 tracking-tight">Privacy Policy & Non-Disclosure (NDA)</h1>
          <p className="text-xs text-slate-400 mb-8">Last Updated: July 6, 2026</p>

          <div className="prose prose-slate text-sm leading-relaxed text-slate-600 flex flex-col gap-6">
            
            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-5">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">🚨 Executive Summary</h2>
              <p className="text-xs text-slate-500">
                AntiFakeNG operates under a zero-trust, cryptographically locked data architecture. All brand assets, batch tokens, supply chain routes, and consumer phone hashes are strictly protected under legally binding non-disclosure protocols.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">1. Scope of Proprietary Information</h2>
              <p>
                Proprietary Information protected under this agreement includes all code tokens, batch volumes, product SKU listings, manufacturer analytics, retailer geolocations, and corporate settings uploaded by manufacturers.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">2. Strict Non-Disclosure (NDA) Policy</h2>
              <p>
                AntiFakeNG and its parent operators agree to hold all manufacturer batch data, token lists, and analytics in the strictest confidence. We will not sell, rent, disclose, or distribute any proprietary manufacturing information to third parties. All batch tokens generated on host servers are immediately hashed and protected using advanced encryption standards.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">3. Consumer Data Privacy & Hashing</h2>
              <p>
                Consumer phone numbers collected during the verification binding process (via WhatsApp or SMS) are strictly utilized to prevent duplicate scanning attacks and distribute loyalty rewards. Consumer identities are isolated and are never shared with external advertisers.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">4. Data Encryption</h2>
              <p>
                All data in transit is encrypted using TLS 1.3, and all static data records (including token mappings and SQL data nodes) are secured using AES-256 encryption. We utilize isolated Hostinger database nodes with strict IP whitelisting to prevent unauthorized remote connection access.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">5. NDA Enforceability & Breach Remediations</h2>
              <p>
                Any breach of the confidentiality covenants outlined in this policy will entitle the affected brand manufacturer to seek injunctive relief, statutory damages, and immediate contract termination. We maintain auditable logs of all dashboard queries and data downloads for legal compliance.
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
          <Link href="/compliance">
            <span className="hover:text-slate-800 cursor-pointer transition-colors">Compliance Posture</span>
          </Link>
        </div>
      </footer>

    </div>
  );
}

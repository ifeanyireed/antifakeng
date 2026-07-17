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
          <span className="text-[10px] font-black text-[#0089C1] uppercase tracking-wider block mb-2">Meta Developer & Privacy Compliance</span>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-slate-400 mb-8">Last Updated: July 7, 2026</p>

          <div className="prose prose-slate text-sm leading-relaxed text-slate-600 flex flex-col gap-6">
            
            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-5">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">💡 Meta & WhatsApp Integration Disclaimer</h2>
              <p className="text-xs text-slate-500">
                AntiFakeNG utilizes Meta APIs, specifically the WhatsApp Business API, to send verification codes (OTPs) to consumers during product scan binding. This policy governs how we collect, store, transmit, and delete user information in compliance with Meta's Developer Policies.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">1. Information We Collect</h2>
              <p className="mb-2">
                We only collect the minimum amount of information necessary to authenticate physical products and prevent fraud:
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li><strong>Phone Numbers</strong>: Collected during the verification binding process to distribute One-Time Passwords (OTPs) via WhatsApp or SMS.</li>
                <li><strong>Geolocations (IP-Based)</strong>: Processed on the fly to detect if a product token is scanned in an anomalous or unexpected location.</li>
                <li><strong>Device Fingerprints</strong>: Basic browser/device identifiers are checked to prevent automated bot/sybil scanning attacks on serial tokens.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">2. How We Use Your Information</h2>
              <p className="mb-2">
                Your data is processed strictly for the following purposes:
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li>Generating and delivering verification sessions to your phone.</li>
                <li>Conducting threat and risk analysis (velocity checks) to identify counterfeit batches.</li>
                <li>We <strong>do not</strong> use your phone number for unsolicited marketing, nor do we sell, rent, or share it with third-party advertisers.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">3. WhatsApp Data & Messaging</h2>
              <p>
                By linking your session, we initiate a transactional WhatsApp message containing your OTP verification code. This interaction complies with the WhatsApp Business Messaging Policy. We do not store your chat history or profile data, and we do not message you again after your session has closed.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">4. Data Retention & Deletion Rights</h2>
              <p>
                Session verification tokens are retained in our logs for brand security analytics. However, you have the absolute right to have your personal phone number unlinked or deleted from our records. To request data deletion, you can use our self-service <Link href="/delete-user-data" className="text-[#0089C1] hover:underline font-semibold">Data Deletion Portal</Link> or contact us at <a href="mailto:privacy@antifake.ng" className="text-[#0089C1] hover:underline font-semibold">privacy@antifake.ng</a>. Deletion requests are processed within 24-48 hours.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">5. Data Security Covenants</h2>
              <p>
                All data in transit is encrypted using TLS 1.3, and all database nodes (including SQL session records and token pools) are secured using AES-256 encryption. We implement strict access controls and do not expose remote connection ports.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">6. Changes to this Policy</h2>
              <p>
                We may periodically update this Privacy Policy to maintain alignment with Meta Developer Policies and changing privacy laws. Significant changes will be announced on this page.
              </p>
            </div>

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
          <Link href="/compliance">
            <span className="hover:text-slate-800 cursor-pointer transition-colors">Compliance Posture</span>
          </Link>
        </div>
      </footer>

    </div>
  );
}

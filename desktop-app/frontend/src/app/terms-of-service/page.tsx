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
          <span className="text-[10px] font-black text-[#0089C1] uppercase tracking-wider block mb-2">Meta API & Service Terms</span>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 tracking-tight">Terms of Service</h1>
          <p className="text-xs text-slate-400 mb-8">Last Updated: July 7, 2026</p>

          <div className="prose prose-slate text-sm leading-relaxed text-slate-600 flex flex-col gap-6">
            
            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-5">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">🚨 Acceptance of Service Covenants</h2>
              <p className="text-xs text-slate-500">
                Welcome to AntiFakeNG. By accessing our consumer verification portals or brand dashboards, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use the platform.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">1. Scope of the Verification Service</h2>
              <p>
                AntiFakeNG provides a cryptographic authenticity verification service. By scanning a product QR label or entering an 8-digit serial token, the platform processes geographic, device, and frequency indicators to output a product threat analysis score (verifying if a product is Genuine, Invalid, or Recalled).
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">2. WhatsApp OTP Verification & Use</h2>
              <p>
                To bind a scan session and access detailed verification reports, consumers are required to request and enter a One-Time Password (OTP) sent via WhatsApp (or SMS). By requesting this code, you warrant that you are the lawful owner of the telephone number supplied and agree to receive transactional messages from our gateway.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">3. Prohibited & Abusive Conduct</h2>
              <p className="mb-2">
                Users are strictly prohibited from engaging in the following actions:
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li>Attempting to brute-force, guess, or bypass the 8-digit serial verification tokens or OTP codes.</li>
                <li>Using automated crawlers, bots, scrapers, or scripts to batch-query verification routes.</li>
                <li>Spoofing browser locations, geolocations, or device fingerprints during a scan session.</li>
                <li>Submitting intentionally false or malicious counterfeit product reports.</li>
              </ul>
              <p className="mt-2 text-xs text-red-600 font-semibold">
                Violating these prohibitions will result in immediate IP banning, device fingerprint blacklisting, and reporting to Meta for API abuse.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">4. Meta & WhatsApp Policy Alignment</h2>
              <p>
                As a developer integration, our services comply with Meta's Developer Policies. Users agree not to misuse, hijack, or automate the WhatsApp Business Messaging endpoints exposed through our portals.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">5. Disclaimer of Warranties</h2>
              <p>
                AntiFakeNG provides a threat risk score based on cryptographic tokens and velocity heuristics. While we work directly with manufacturer brands, we do not warrant or guarantee the merchantability, safety, or usability of any third-party physical goods. Counterfeit verification outcomes are indicators of authenticity and do not constitute legal representation.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">6. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, AntiFakeNG and its operators shall not be liable for any direct, indirect, incidental, or consequential damages resulting from product scans, false-positive threat assessments, or temporary service outages.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-300/20 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto">
        <p>© 2026 AntiFakeNG Authenticity Platform. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/privacy-policy">
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

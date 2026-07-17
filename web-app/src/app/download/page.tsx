"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function DownloadPage() {
  const [detectedOS, setDetectedOS] = useState<"windows" | "mac" | "other">("other");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const ua = window.navigator.userAgent;
    if (ua.indexOf("Windows") !== -1 || ua.indexOf("Win32") !== -1) {
      setDetectedOS("windows");
    } else if (ua.indexOf("Macintosh") !== -1 || ua.indexOf("MacIntel") !== -1 || ua.indexOf("Mac OS X") !== -1) {
      setDetectedOS("mac");
    } else {
      setDetectedOS("other");
    }
  }, []);

  // Download URLs
  const winDownloadUrl = "https://cdn.antifake.ng/desktop/antifake-desktop-setup.exe";
  const macDownloadUrl = "https://cdn.antifake.ng/desktop/antifake-desktop.dmg";

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-slate-800 font-sans flex flex-col overflow-x-hidden">
      
      {/* NAVBAR */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-50 sticky top-0 bg-[#E8EFF4]/90 backdrop-blur-md border-b border-slate-300/20">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="AntiFakeNG Logo" className="w-10 h-10 object-contain" />
          <span className="font-extrabold text-xl tracking-tight text-slate-900 text-display">AntiFakeNG</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/support" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
            Support Helpdesk
          </Link>
          <Link href="/">
            <button className="bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold px-5 py-2 rounded-full text-xs shadow-sm">
              Back to Home
            </button>
          </Link>
        </div>
      </header>

      {/* HERO / DOWNLOAD CONTAINER */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col items-center">
        
        {/* Animated Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-[#DDEEF3] border border-sky-200/50 rounded-full px-4 py-1.5 mb-6 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-[#0089C1] animate-ping" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#0089C1]">
            Desktop Companion App
          </span>
        </motion.div>

        {/* Dynamic Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center max-w-2xl"
        >
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight text-display mb-4">
            High-Performance Print Layout Generation
          </h1>
          <p className="text-sm md:text-base text-slate-600 font-medium mb-12">
            Offload CPU-intensive 300 DPI exports to your local desktop RAM. Generate thousands of high-fidelity secure labels instantly with zero server limits.
          </p>
        </motion.div>

        {/* Glassmorphism Main Download Card */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-xl bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col items-center text-center"
          >
            {/* Top decorative gradient blur */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-2 bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500 rounded-full opacity-60" />

            <div className="w-16 h-16 bg-[#DDEEF3] rounded-2xl flex items-center justify-between p-4 mb-6 shadow-inner">
              {detectedOS === "windows" ? (
                // Windows SVG
                <svg className="w-full h-full text-[#0089C1]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.1zM11.25 1.899L24 0v11.55H11.25V1.899zM11.25 12.45H24v11.55l-12.75-1.9v-9.65z"/>
                </svg>
              ) : detectedOS === "mac" ? (
                // Apple SVG
                <svg className="w-full h-full text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.01 2.96 1.12.09 2.26-.56 2.94-1.39z"/>
                </svg>
              ) : (
                // General Device SVG
                <svg className="w-full h-full text-[#0089C1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              )}
            </div>

            {/* Dynamic Button Headline */}
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {detectedOS === "windows" && "AntiFakeNG for Windows"}
              {detectedOS === "mac" && "AntiFakeNG for macOS"}
              {detectedOS === "other" && "Select Your System Option"}
            </h2>
            <p className="text-xs text-slate-500 font-bold mb-6">
              Stable Build v2.13.0 • CGo Standalone Exporter
            </p>

            {/* Main Action Call */}
            {detectedOS === "windows" && (
              <a href={winDownloadUrl} className="w-full">
                <button className="w-full bg-[#0089C1] hover:bg-sky-600 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-sm">
                  <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                  </svg>
                  Download Installer for Windows (.exe)
                </button>
              </a>
            )}

            {detectedOS === "mac" && (
              <a href={macDownloadUrl} className="w-full">
                <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-sm">
                  <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                  </svg>
                  Download Application for macOS (.dmg)
                </button>
              </a>
            )}

            {detectedOS === "other" && (
              <div className="w-full flex flex-col gap-3">
                <a href={winDownloadUrl}>
                  <button className="w-full bg-[#0089C1] hover:bg-sky-600 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all text-xs flex items-center justify-center gap-2">
                    Download for Windows (.exe)
                  </button>
                </a>
                <a href={macDownloadUrl}>
                  <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all text-xs flex items-center justify-center gap-2">
                    Download for macOS (.dmg)
                  </button>
                </a>
              </div>
            )}

            {/* Alternates selector */}
            {detectedOS !== "other" && (
              <p className="text-xs text-slate-500 font-bold mt-6">
                Looking for another platform?{" "}
                {detectedOS === "windows" ? (
                  <a href={macDownloadUrl} className="text-[#0089C1] hover:underline">
                    Download macOS version
                  </a>
                ) : (
                  <a href={winDownloadUrl} className="text-[#0089C1] hover:underline">
                    Download Windows version
                  </a>
                )}
              </p>
            )}
          </motion.div>
        )}

        {/* FEATURES OVERVIEW SECTION */}
        <section className="w-full max-w-4xl grid md:grid-cols-3 gap-6 mt-20">
          
          {/* Card 1: Local RAM */}
          <div className="bg-white/60 border border-slate-200/50 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center p-2 mb-4 text-[#0089C1]">
              <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
                <line x1="6" y1="6" x2="6.01" y2="6"/>
                <line x1="6" y1="18" x2="6.01" y2="18"/>
              </svg>
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-2">Local RAM Processing</h3>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              Bypasses server resources by rendering images directly in the desktop's RAM. Handles layout files for thousands of products without network timeouts.
            </p>
          </div>

          {/* Card 2: 300 DPI */}
          <div className="bg-white/60 border border-slate-200/50 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center p-2 mb-4 text-teal-600">
              <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5h16.5M12 12h.008v.008H12V12zm0-3.75h.008v.008H12V8.25zm0 7.5h.008v.008H12v-.008zm3.75-3.75h.008v.008H15.75V12zm0-3.75h.008v.008H15.75V8.25zm-7.5 7.5h.008v.008H8.25v-.008zm0-3.75h.008v.008H8.25V12z"/>
              </svg>
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-2">Crisp Print DPI</h3>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              Export at 300 DPI high-definition resolution. Ensures QR codes, serial numbers, and checkmarks are 100% scan-ready for industrial printers.
            </p>
          </div>

          {/* Card 3: Secure Companion */}
          <div className="bg-white/60 border border-slate-200/50 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center p-2 mb-4 text-indigo-600">
              <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
              </svg>
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-2">Secure Direct Saving</h3>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              Downloads render directly to your disk, skipping browser blob limits. Keeps API tokens encrypted using native OS environment buffers.
            </p>
          </div>

        </section>

        {/* INSTALLATION INSTRUCTIONS */}
        <section className="w-full max-w-3xl mt-24">
          <h2 className="text-2xl font-black text-slate-900 mb-8 text-center">Installation Instructions</h2>
          
          <div className="space-y-6">
            
            {/* Windows Tab */}
            <div className="bg-white/80 border border-slate-200/60 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#DDEEF3] flex items-center justify-center p-1.5 text-[#0089C1]">
                  <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.1zM11.25 1.899L24 0v11.55H11.25V1.899zM11.25 12.45H24v11.55l-12.75-1.9v-9.65z"/>
                  </svg>
                </div>
                <h3 className="font-black text-slate-900 text-base">Windows Setup Guide</h3>
              </div>
              <ol className="list-decimal list-inside text-xs text-slate-600 font-bold space-y-2.5">
                <li>Download the `antifake-desktop-setup.exe` installer from the button above.</li>
                <li>Run the executable file.</li>
                <li>
                  <span className="text-amber-600 font-black">Note for SmartScreen:</span> Since the executable is freshly compiled, Windows SmartScreen may show a security prompt. Click <strong className="text-slate-800">"More Info"</strong> and select <strong className="text-slate-800">"Run Anyway"</strong> to proceed.
                </li>
                <li>Follow the setup wizard to complete the installation and launch from your desktop.</li>
              </ol>
            </div>

            {/* Mac Tab */}
            <div className="bg-white/80 border border-slate-200/60 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center p-1.5 text-slate-800">
                  <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.01 2.96 1.12.09 2.26-.56 2.94-1.39z"/>
                  </svg>
                </div>
                <h3 className="font-black text-slate-900 text-base">macOS Setup Guide</h3>
              </div>
              <ol className="list-decimal list-inside text-xs text-slate-600 font-bold space-y-2.5">
                <li>Download the `antifake-desktop.dmg` disk image file.</li>
                <li>Double-click the downloaded `.dmg` file to mount it.</li>
                <li>Drag the <strong className="text-slate-800">AntiFakeNG</strong> application icon into your <strong className="text-slate-800">Applications</strong> folder shortcut.</li>
                <li>Launch the app. If macOS blocks it as unsigned, open your Mac's <strong className="text-slate-800">System Settings → Privacy & Security</strong>, scroll down, and click <strong className="text-slate-800">"Open Anyway"</strong>.</li>
              </ol>
            </div>

          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold">
          <p>© 2026 AntiFakeNG. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

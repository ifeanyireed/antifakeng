"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/ahnara/AuthContext";

export default function DownloadPage() {
  const [detectedOS, setDetectedOS] = useState<"windows" | "mac" | "other">("other");
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const winDownloadUrl = "https://cdn.antifake.ng/uploads/desktop/antifake-desktop-setup.exe";
  const macDownloadUrl = "https://cdn.antifake.ng/uploads/desktop/antifake-desktop.dmg";

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-slate-800 font-sans flex flex-col overflow-x-hidden">
      
      {/* NAVBAR */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-50 sticky top-0 bg-[#E8EFF4]/90 backdrop-blur-md border-b border-slate-300/20">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="AntiFakeNG Logo" className="w-10 h-10 object-contain" />
          <span className="font-extrabold text-xl tracking-tight text-slate-900 text-display">AntiFakeNG</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <Link href="/" className="hover:text-slate-950 transition-colors">Home</Link>
          <Link href="/support" className="hover:text-slate-950 transition-colors">Support Helpdesk</Link>
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <Link href="/consumer">
            <button className="bg-[#0089C1] hover:bg-sky-600 text-white transition-all font-bold px-5 py-2.5 rounded-full text-sm shadow-sm">
              Verify Product
            </button>
          </Link>
          {!user ? (
            <Link href="/login">
              <button className="bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold px-5 py-2.5 rounded-full text-sm shadow-sm">
                Sign In
              </button>
            </Link>
          ) : (
            <Link href={user.role === "ADMIN" ? "/admin/dashboard" : "/producer/dashboard"}>
              <button className="bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold px-5 py-2.5 rounded-full text-sm shadow-sm">
                Dashboard
              </button>
            </Link>
          )}
        </div>

        {/* Burger Button (Mobile Only) */}
        <button 
          className="md:hidden text-slate-800 text-2xl font-bold focus:outline-none" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* Mobile Nav Links Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden w-full bg-[#E8EFF4] border-b border-slate-300/30 px-6 py-4 flex flex-col gap-4 text-sm font-semibold text-slate-600 z-40"
          >
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-950 transition-colors">Home</Link>
            <Link href="/support" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-950 transition-colors">Support</Link>
            <div className="flex flex-col gap-2 pt-3 border-t border-slate-300/20">
              <Link href="/consumer" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full bg-[#0089C1] hover:bg-sky-600 text-white transition-all font-bold py-2.5 rounded-full text-sm shadow-sm text-center">
                  Verify Product
                </button>
              </Link>
              {!user ? (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold py-2.5 rounded-full text-sm shadow-sm text-center">
                    Sign In
                  </button>
                </Link>
              ) : (
                <Link href={user.role === "ADMIN" ? "/admin/dashboard" : "/producer/dashboard"} onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold py-2.5 rounded-full text-sm shadow-sm text-center">
                    Dashboard
                  </button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 mb-12 mt-2">
        
        {/* Large Rounded Hero Card */}
        <div className="w-full bg-[#E9F2F5] rounded-[48px] pt-8 pb-12 px-6 md:px-12 flex flex-col items-center text-center relative overflow-hidden border border-slate-200/20">
          
          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-normal text-slate-900 tracking-tight text-display mb-4 leading-[1.1] max-w-4xl text-center relative z-20">
            AntiFakeNG for Desktop
          </h1>

          {/* Description */}
          <p className="text-slate-600 font-semibold text-xs md:text-sm mb-3 max-w-2xl text-center leading-relaxed relative z-20">
            Offload CPU and RAM-heavy print layout generation to your local machine. Export thousands of 300 DPI codes instantly with no timeouts.
          </p>

          {/* Desktop Showcase Image */}
          <img 
            src="/desktop-app.png" 
            alt="AntiFakeNG Desktop Companion" 
            className="w-full max-w-lg h-auto object-contain hover:scale-[1.02] transition-transform duration-300 mb-10 relative z-20" 
          />

          {/* Dynamic Button CTA Box */}
          {mounted && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 relative z-20">
              {detectedOS === "windows" && (
                <a href={winDownloadUrl}>
                  <button className="bg-[#0089C1] hover:bg-sky-600 text-white transition-all font-bold px-8 py-4 text-sm rounded-full shadow-md hover:shadow-lg flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                    </svg>
                    Download for Windows (.exe)
                  </button>
                </a>
              )}

              {detectedOS === "mac" && (
                <a href={macDownloadUrl}>
                  <button className="bg-slate-900 hover:bg-slate-800 text-white transition-all font-bold px-8 py-4 text-sm rounded-full shadow-md hover:shadow-lg flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                    </svg>
                    Download for macOS (.dmg)
                  </button>
                </a>
              )}

              {detectedOS === "other" && (
                <>
                  <a href={winDownloadUrl}>
                    <button className="bg-[#0089C1] hover:bg-sky-600 text-white transition-all font-bold px-6 py-3.5 rounded-full text-sm shadow-sm flex items-center gap-2">
                      Download for Windows (.exe)
                    </button>
                  </a>
                  <a href={macDownloadUrl}>
                    <button className="bg-slate-900 hover:bg-slate-800 text-white transition-all font-bold px-6 py-3.5 rounded-full text-sm shadow-sm flex items-center gap-2">
                      Download for macOS (.dmg)
                    </button>
                  </a>
                </>
              )}
            </div>
          )}

          {/* Alternate OS Choice */}
          {mounted && detectedOS !== "other" && (
            <p className="text-xs text-slate-500 font-semibold mb-12 -mt-6 relative z-20">
              Prefer another platform?{" "}
              {detectedOS === "windows" ? (
                <a href={macDownloadUrl} className="text-[#0089C1] hover:underline font-bold">
                  Download macOS client (.dmg)
                </a>
              ) : (
                <a href={winDownloadUrl} className="text-[#0089C1] hover:underline font-bold">
                  Download Windows client (.exe)
                </a>
              )}
            </p>
          )}

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full mt-2 mb-16 relative z-20">
            <div className="bg-white/40 backdrop-blur-md border border-slate-200/50 rounded-3xl p-6 text-left shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-[#DDEEF3] flex items-center justify-center text-[#0089C1] mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">Local Hardware Rendering</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Uses your computer's RAM and CPU for rapid processing of image sheets, bypassing server-side memory bottlenecks.
              </p>
            </div>
            <div className="bg-white/40 backdrop-blur-md border border-slate-200/50 rounded-3xl p-6 text-left shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-[#DDEEF3] flex items-center justify-center text-[#0089C1] mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">300 DPI Quality</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Crisp, high-resolution vector and bitmap generation to ensure error-free scans on industrial printers.
              </p>
            </div>
            <div className="bg-white/40 backdrop-blur-md border border-slate-200/50 rounded-3xl p-6 text-left shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-[#DDEEF3] flex items-center justify-center text-[#0089C1] mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5l3 3m0 0l3-3m-3 3v-6m1.06-4.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/>
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">Direct Disk Saving</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Saves print layout files directly to selected folders without browser sandbox boundaries.
              </p>
            </div>
          </div>
        </div>

        {/* DETAILED INSTALLATION GUIDES */}
        <section className="w-full max-w-4xl mx-auto mt-24">
          <h2 className="text-2xl font-black text-slate-900 mb-8 text-center">Installation Guides</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Windows Panel */}
            <div className="bg-white/80 border border-slate-200/60 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#DDEEF3] flex items-center justify-center p-1.5 text-[#0089C1]">
                  <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.1zM11.25 1.899L24 0v11.55H11.25V1.899zM11.25 12.45H24v11.55l-12.75-1.9v-9.65z"/>
                  </svg>
                </div>
                <h3 className="font-black text-slate-900 text-base">Windows PC Guide</h3>
              </div>
              <ol className="list-decimal list-inside text-xs text-slate-600 font-bold space-y-3">
                <li>Download the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">antifake-desktop-setup.exe</code> installer above.</li>
                <li>Launch the installer executable on your Windows PC.</li>
                <li>
                  <span className="text-amber-600 font-black">SmartScreen:</span> If prompted by Windows SmartScreen (due to fresh compilation signature), click <strong className="text-slate-800">"More Info"</strong> and select <strong className="text-slate-800">"Run Anyway"</strong>.
                </li>
                <li>Complete the setup wizard to place a shortcut on your desktop.</li>
              </ol>
            </div>

            {/* Mac Panel */}
            <div className="bg-white/80 border border-slate-200/60 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center p-1.5 text-slate-800">
                  <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.01 2.96 1.12.09 2.26-.56 2.94-1.39z"/>
                  </svg>
                </div>
                <h3 className="font-black text-slate-900 text-base">macOS Guide</h3>
              </div>
              <ol className="list-decimal list-inside text-xs text-slate-600 font-bold space-y-3">
                <li>Download the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">antifake-desktop.dmg</code> volume disk image.</li>
                <li>Mount the `.dmg` image by double-clicking it.</li>
                <li>Drag the <strong className="text-slate-800">AntiFakeNG</strong> app icon into your <strong className="text-slate-800">Applications</strong> directory.</li>
                <li>Launch the app. If macOS blocks it as unsigned, go to <strong className="text-slate-800">System Settings → Privacy & Security</strong>, scroll down, and click <strong className="text-slate-800">"Open Anyway"</strong>.</li>
              </ol>
            </div>

          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full bg-[#E8EFF4] text-[#0D090C]/60 py-16 border-t border-slate-300/40 relative z-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Logo & Slogan Column */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="AntiFakeNG Logo" className="w-9 h-9 object-contain" />
              <span className="font-extrabold text-lg text-slate-900 tracking-tight text-display">AntiFakeNG</span>
            </div>
            <p className="text-xs leading-relaxed max-w-sm font-semibold">
              A multi-tenant authenticity and counterfeit-detection platform for manufacturers. Secure browser-first verification, code isolation, and live geo-analytics.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Product</h4>
            <Link href="/#how-it-works" className="text-xs font-semibold hover:text-[#0089C1] transition-colors">How it works</Link>
            <Link href="/#features" className="text-xs font-semibold hover:text-[#0089C1] transition-colors">Features</Link>
            <Link href="/#security" className="text-xs font-semibold hover:text-[#0089C1] transition-colors">Security</Link>
            <Link href="/#pricing" className="text-xs font-semibold hover:text-[#0089C1] transition-colors">Pricing</Link>
          </div>

          {/* Legal / Contact Column */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Connect</h4>
            <a href="mailto:hello@antifakeng.com" className="text-xs font-semibold hover:text-[#0089C1] transition-colors">hello@antifakeng.com</a>
            <a href="tel:+2348067028859" className="text-xs font-semibold hover:text-[#0089C1] transition-colors">+234 806 702 8859</a>
            <Link href="/#contact" className="text-xs font-semibold hover:text-[#0089C1] transition-colors">Request a Demo</Link>
            <span className="text-xs font-semibold mt-2 block text-slate-400">Lagos, Nigeria</span>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-300/40 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
          <p>© 2026 AntiFakeNG. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

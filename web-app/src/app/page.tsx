"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/ahnara/AuthContext";
import { AhnaraLoader } from "@/components/ahnara/AhnaraLoader";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDossierTab, setActiveDossierTab] = useState("vision");
  const { user, loading } = useAuth();
  const router = useRouter();

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Hello! I am your AntiFakeNG support assistant. Ask me anything about verifying products, printing layouts, or managing security!"
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Homepage Demo Request form states
  const [demoName, setDemoName] = useState("");
  const [demoCompany, setDemoCompany] = useState("");
  const [demoEmail, setDemoEmail] = useState("");
  const [demoMessage, setDemoMessage] = useState("");
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${API_BASE}/api/auth/support/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          form_type: "contact",
          name: demoName,
          email: demoEmail,
          phone: "",
          subject: "Demo Request from Homepage",
          token: "",
          store_name: demoCompany,
          message: demoMessage
        })
      });

      if (res.ok) {
        setDemoSubmitted(true);
        setDemoName("");
        setDemoCompany("");
        setDemoEmail("");
        setDemoMessage("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit demo request.");
      }
    } catch (err) {
      alert("Demo request service is currently offline.");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await fetch("/api/support/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...chatMessages.map(m => ({ role: m.role, content: m.content })), { role: "user", content: userMessage }]
        })
      });

      const data = await response.json();
      if (response.ok && data.reply) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setChatMessages((prev) => [...prev, { role: "assistant", content: `Error: ${data.error || "Failed to get reply."}` }]);
      }
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: `Network error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/producer/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <AhnaraLoader fullScreen label="Syncing Session..." />
    );
  }

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-slate-800 font-sans flex flex-col overflow-x-hidden">
      
      {/* NAVBAR */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-50 sticky top-0 bg-[#E8EFF4]/90 backdrop-blur-md border-b border-slate-300/20">
        {/* Logo and Name */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="AntiFakeNG Logo" className="w-10 h-10 object-contain" />
          <span className="font-extrabold text-xl tracking-tight text-slate-900 text-display">AntiFakeNG</span>
        </div>

        {/* Mid Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <a href="#features" className="hover:text-slate-950 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-slate-950 transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-slate-950 transition-colors">FAQ</a>
          <Link href="/support" className="hover:text-slate-950 transition-colors">Support</Link>
        </nav>

        {/* Action Buttons (Desktop Only) */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/consumer">
            <button className="bg-[#0089C1] hover:bg-sky-600 text-white transition-all font-bold px-5 py-2.5 rounded-full text-sm shadow-sm">
              Verify Product
            </button>
          </Link>
          <Link href="/login">
            <button className="bg-white border border-slate-200 text-slate-800 font-bold px-5 py-2.5 rounded-full text-sm hover:bg-slate-50 transition-all shadow-sm">
              Sign In
            </button>
          </Link>
          <Link href="/register">
            <button className="bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold px-5 py-2.5 rounded-full text-sm shadow-sm">
              Register
            </button>
          </Link>
        </div>

        {/* Burger Button (Mobile Only) */}
        <button 
          className="md:hidden text-slate-800 text-2xl font-bold focus:outline-none" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
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
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-950 transition-colors">Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-950 transition-colors">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-950 transition-colors">FAQ</a>
            <Link href="/support" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-950 transition-colors">Support</Link>

            {/* Action Buttons inside Mobile Menu Dropdown */}
            <div className="flex flex-col gap-2 pt-3 border-t border-slate-300/20">
              <Link href="/consumer" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full bg-[#0089C1] hover:bg-sky-600 text-white transition-all font-bold py-2.5 rounded-full text-sm shadow-sm text-center">
                  Verify Product
                </button>
              </Link>
              <div className="flex gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                  <button className="w-full bg-white border border-slate-200 text-slate-800 font-bold py-2.5 rounded-full text-sm hover:bg-slate-50 transition-all shadow-sm text-center">
                    Sign In
                  </button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                  <button className="w-full bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold py-2.5 rounded-full text-sm shadow-sm text-center">
                    Register
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 mb-6 mt-6">
        
        {/* Large Rounded Hero Card */}
        <div className="w-full bg-[#E9F2F5] rounded-[48px] pt-16 px-6 md:px-12 flex flex-col items-center text-center relative overflow-hidden border border-slate-200/20">
          
          {/* Floating 3D Shapes */}
          {/* Left Shape (3D Pill Bottle Mockup) */}
          <motion.div
            animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[-2%] top-[20%] w-72 h-72 hidden xl:block pointer-events-none z-10"
          >
            <img 
              src="/pill_bottle_mockup.png" 
              alt="Secure Pill Container 3D Mockup" 
              className="w-full h-full object-contain drop-shadow-2xl rounded-3xl"
            />
          </motion.div>

          {/* Right Shape (Teal Cylinder) */}
          <motion.div
            animate={{ y: [0, 12, 0], rotate: [0, -4, 0] }}
            transition={{ duration: 6, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-[-4%] top-[22%] w-64 h-64 hidden xl:block pointer-events-none z-10"
          >
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
              <path d="M 40,90 L 40,120 A 60,30 0 0,0 160,120 L 160,90 Z" fill="#3D5C5B" />
              <ellipse cx="100" cy="90" rx="60" ry="30" fill="#5F8D8C" />
            </svg>
          </motion.div>

          {/* Version Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-[10px] font-bold text-slate-500 shadow-sm border border-slate-100 uppercase tracking-wider mb-6 relative z-20">
            Product Authenticity Platform
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-normal text-slate-900 tracking-tight text-display mb-6 leading-[1.1] max-w-4xl text-center relative z-20">
            Real products shouldn't need to argue with fakes.
          </h1>

          {/* Description */}
          <p className="text-slate-600 font-semibold text-base md:text-lg mb-8 max-w-3xl text-center leading-relaxed relative z-20">
            AntiFakeNG gives every unit you produce a verifiable identity. Customers confirm it's genuine from any phone browser in under a minute — no app, no guesswork — while you watch counterfeit activity surface in real time, by batch, by region, by retailer.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 relative z-20">
            <Link href="/consumer">
              <button className="bg-[#0089C1] hover:bg-sky-600 text-white transition-all font-bold px-8 py-3.5 rounded-full shadow-lg whitespace-nowrap">
                Verify Product
              </button>
            </Link>
            <a href="#contact">
              <button className="bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold px-8 py-3.5 rounded-full shadow-lg whitespace-nowrap">
                Request a Demo
              </button>
            </a>
            <a href="#how-it-works">
              <button className="bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 transition-all font-bold px-8 py-3.5 rounded-full shadow-sm whitespace-nowrap">
                See How Verification Works
              </button>
            </a>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col items-center gap-2 mb-10 relative z-20">
            <div className="flex items-center gap-1">
              {/* Avatar stack */}
              <div className="flex -space-x-2">
                <img src="/character1.jpg" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
                <img src="/character2.jpg" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
                <img src="/character3.jpg" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
                <img src="/character4.jpg" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
              </div>
              {/* Stars */}
              <div className="flex items-center gap-0.5 ml-2">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500">Trusted by leading brand protection teams</span>
          </div>



          {/* Supported Sectors & standards */}
          <div className="w-full max-w-5xl py-8 px-6 bg-[#E8EFF4]/40 rounded-3xl border border-slate-200/80 flex flex-col items-center gap-6 relative z-20 mt-10 mb-20 shadow-xs">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">supported sectors &amp; standards</span>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-90">
              
              {/* Pharma */}
              <div className="flex items-center gap-2 text-slate-700 select-none pointer-events-none">
                <svg className="w-5 h-5 text-[#0089C1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4.5 10.5a6 6 0 1 1 12 0 6 6 0 0 1-12 0z" />
                  <path d="M12 2v6" />
                  <path d="M9 5h6" />
                </svg>
                <span className="font-sans font-bold text-xs tracking-wider uppercase text-slate-800">Pharmaceuticals</span>
              </div>
              
              {/* Agro */}
              <div className="flex items-center gap-2 text-slate-700 select-none pointer-events-none">
                <svg className="w-5 h-5 text-[#608216]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span className="font-sans font-bold text-xs tracking-wider uppercase text-slate-800">Agro-Chemicals</span>
              </div>

              {/* Cosmetics */}
              <div className="flex items-center gap-2 text-slate-700 select-none pointer-events-none">
                <svg className="w-5 h-5 text-[#0089C1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l7 4v6c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z" />
                </svg>
                <span className="font-sans font-bold text-xs tracking-wider uppercase text-slate-800">Cosmetics</span>
              </div>

              {/* Electronics */}
              <div className="flex items-center gap-2 text-slate-700 select-none pointer-events-none">
                <svg className="w-5 h-5 text-[#608216]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="4" />
                  <path d="M6 12h12" />
                  <path d="M12 6v12" />
                </svg>
                <span className="font-sans font-bold text-xs tracking-wider uppercase text-slate-800">Electronics</span>
              </div>

              {/* Beverages */}
              <div className="flex items-center gap-2 text-slate-700 select-none pointer-events-none">
                <svg className="w-5 h-5 text-[#0089C1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M5 5h14M8 10h8M6 15h12" />
                </svg>
                <span className="font-sans font-bold text-xs tracking-wider uppercase text-slate-800">Beverages &amp; FMCG</span>
              </div>

            </div>
          </div>

        </div>

        {/* ================= HOW IT WORKS (consumer) ================= */}
        <section className="w-full max-w-6xl mx-auto px-6 py-20 relative z-20 scroll-mt-6" id="how-it-works">
          <div className="flex flex-col items-center text-center max-w-3xl mb-12 mx-auto">
            <span className="bg-[#E8F3CE] border border-[#CDE0A4] text-[#608216] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-4">
              For Consumers
            </span>
            <h2 className="text-3xl md:text-5xl font-normal text-slate-900 tracking-tight text-display mb-4 leading-tight">
              Four steps between a shelf and certainty.
            </h2>
            <p className="text-slate-500 font-semibold text-base max-w-xl leading-relaxed">
              Every unit carries a unique QR code. There's nothing to install — the whole flow happens in the browser your customer already has.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <span className="w-8 h-8 rounded-full border border-[#0089C1] text-[#0089C1] flex items-center justify-center font-mono font-bold text-sm">1</span>
              <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight">Scan the code</h3>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">The code opens the official verification page for that product — never a third-party app.</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <span className="w-8 h-8 rounded-full border border-[#0089C1] text-[#0089C1] flex items-center justify-center font-mono font-bold text-sm">2</span>
              <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight">Confirm a phone</h3>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">A one-time password ties the check to a real, reachable person, not an automated script.</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <span className="w-8 h-8 rounded-full border border-[#0089C1] text-[#0089C1] flex items-center justify-center font-mono font-bold text-sm">3</span>
              <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight">Risk analysis</h3>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">The engine weighs the code's history, location, and pattern of use — not just whether it exists.</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <span className="w-8 h-8 rounded-full border border-[#0089C1] text-[#0089C1] flex items-center justify-center font-mono font-bold text-sm">4</span>
              <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight">Get plain answer</h3>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">Genuine, Previously Verified, Suspicious, or Invalid, with clear next steps for each.</p>
            </div>
          </div>
          <p className="text-center font-mono text-xs text-slate-500 mt-8 tracking-wide">Consumers can also file a report directly from the result screen if something looks wrong.</p>
        </section>

        {/* ================= FOR PRODUCERS ================= */}
        <section className="w-full max-w-6xl mx-auto px-6 py-20 relative z-20 border-t border-slate-200/80 scroll-mt-6" id="producers">
          <div className="flex flex-col items-center text-center max-w-3xl mb-12 mx-auto">
            <span className="bg-[#E8F3CE] border border-[#CDE0A4] text-[#608216] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-4">
              For Producers
            </span>
            <h2 className="text-3xl md:text-5xl font-normal text-slate-900 tracking-tight text-display mb-4 leading-tight">
              From production line to proof, in one workspace.
            </h2>
            <p className="text-slate-500 font-semibold text-base max-w-xl leading-relaxed">
              Register a product once. Generate authentication codes by the batch. Print, ship, and watch verification data come back from the field.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#E8EFF4]/40 border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-3">
              <span className="text-[#608216] font-mono text-xs uppercase tracking-widest font-black">Step 01</span>
              <h3 className="text-base font-extrabold text-slate-800">Create the product</h3>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">Add SKU, category and the specific details that should show up in a verification result.</p>
            </div>
            <div className="bg-[#E8EFF4]/40 border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-3">
              <span className="text-[#608216] font-mono text-xs uppercase tracking-widest font-black">Step 02</span>
              <h3 className="text-base font-extrabold text-slate-800">Open a production batch</h3>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">Tie quantity, manufacture date and expiry to a specific production run.</p>
            </div>
            <div className="bg-[#E8EFF4]/40 border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-3">
              <span className="text-[#608216] font-mono text-xs uppercase tracking-widest font-black">Step 03</span>
              <h3 className="text-base font-extrabold text-slate-800">Generate codes</h3>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">Each code is a unique, cryptographically random token — never reused, never guessable.</p>
            </div>
            <div className="bg-[#E8EFF4]/40 border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-3">
              <span className="text-[#608216] font-mono text-xs uppercase tracking-widest font-black">Step 04</span>
              <h3 className="text-base font-extrabold text-slate-800">Download &amp; print</h3>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">Export print-ready label files sized for your existing packaging line.</p>
            </div>
            <div className="bg-[#E8EFF4]/40 border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-3">
              <span className="text-[#608216] font-mono text-xs uppercase tracking-widest font-black">Step 05</span>
              <h3 className="text-base font-extrabold text-slate-800">Monitor verification</h3>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">See scan volume, location and outcome roll in as products reach real customers.</p>
            </div>
            <div className="bg-[#E8EFF4]/40 border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-3">
              <span className="text-[#608216] font-mono text-xs uppercase tracking-widest font-black">Step 06</span>
              <h3 className="text-base font-extrabold text-slate-800">Investigate alerts</h3>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">Turn a cluster of suspicious scans into a case your team can investigate and resolve.</p>
            </div>
          </div>
        </section>

        {/* ================= FEATURES GRID ================= */}
        {/* Features Intro Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mb-12 relative z-20 mt-16 mx-auto scroll-mt-6" id="features">
          <span className="bg-[#E8F3CE] border border-[#CDE0A4] text-[#608216] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-5xl font-normal text-slate-900 tracking-tight text-display mb-4 leading-tight">
            Secure authenticity infrastructure, not a sticker.
          </h2>
          <p className="text-slate-500 font-semibold text-base max-w-xl leading-relaxed">
            Every check weighs device, location, timing, and signature history rather than just checking a database entry.
          </p>
        </div>

        {/* Alternating Feature Cards Grid */}
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-24 relative z-20 mx-auto">
          
          {/* Card 1: Photo (Consumer verification) */}
          <div className="aspect-square rounded-3xl overflow-hidden shadow-md group relative">
            <img src="/antifake-scan.jpg" alt="Consumer scan" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-slate-950/10" />
          </div>

          {/* Card 2: Text Card (Browser-first verification) */}
          <div className="aspect-square rounded-3xl bg-[#E8F6FA] border border-sky-200/30 p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight mb-3 text-display">
                Browser-First <br />Verification
              </h3>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                No app download, no login for consumers. Works on ordinary smartphone browsers, even on a slow connection. Ties check to a real phone number via OTP to prevent bot traffic.
              </p>
            </div>
            <a href="#blueprint" className="text-xs font-black text-[#0089C1] hover:underline flex items-center gap-1">
              System Blueprint &rarr;
            </a>
          </div>

          {/* Card 3: Photo (Production line) */}
          <div className="aspect-square rounded-3xl overflow-hidden shadow-md group relative">
            <img src="/antifake-factory.jpg" alt="Production line" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-slate-950/10" />
          </div>

          {/* Card 4: Text Card (Cryptographically Random Codes) */}
          <div className="aspect-square rounded-3xl bg-slate-800 border border-slate-700 p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight leading-tight mb-3 text-display">
                Cryptographically <br />Random Codes
              </h3>
              <p className="text-xs text-[#AEB9CC] font-semibold leading-relaxed">
                Tokens are generated, signed, and collision-checked before issue. Never reused, never guessable. Each code carries a signature that's checked on each scan, not just its existence.
              </p>
            </div>
            <a href="#blueprint" className="text-xs font-black text-[#8BB436] hover:underline flex items-center gap-1">
              Token Specs &rarr;
            </a>
          </div>

          {/* Card 5: Text Card (Multi-tenant design) */}
          <div className="aspect-square rounded-3xl bg-slate-100 border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight mb-3 text-display">
                Multi-Tenant <br />Design
              </h3>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                Run many brands safely on one platform. Each producer's data, users, and codes stay within their own secure boundary, with row-level database isolation.
              </p>
            </div>
            <a href="#blueprint" className="text-xs font-black text-slate-700 hover:underline flex items-center gap-1">
              Multi-tenant architecture &rarr;
            </a>
          </div>

          {/* Card 6: Photo (Analytics dashboard) */}
          <div className="aspect-square rounded-3xl overflow-hidden shadow-md group relative">
            <img src="/antifake-analytics.jpg" alt="Analytics dashboard" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-slate-950/10" />
          </div>

          {/* Card 7: Text Card (Fraud Detection Engine) */}
          <div className="aspect-square rounded-3xl bg-[#E8F3CE]/45 border border-[#CDE0A4] p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight mb-3 text-display">
                Fraud Detection <br />Engine
              </h3>
              <p className="text-xs text-[#608216] font-semibold leading-relaxed">
                Scoring verifications against geographic travel speed, IP, and device fingerprint mismatches. Real-time alerts turn clusters of suspicious scans into cases your team can resolve.
              </p>
            </div>
            <a href="#blueprint" className="text-xs font-black text-[#608216] hover:underline flex items-center gap-1">
              Scoring logic &rarr;
            </a>
          </div>

          {/* Card 8: Photo (Retail store shelf) */}
          <div className="aspect-square rounded-3xl overflow-hidden shadow-md group relative">
            <img src="/antifake-shelf.jpg" alt="Verified products on retail shelf" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-slate-950/10" />
          </div>

        </div>

        {/* ================= SECURITY SECTION ================= */}
        <section className="w-full max-w-6xl mx-auto px-6 py-20 relative z-20 border-t border-slate-200/80 scroll-mt-6" id="security">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1">
              <span className="bg-[#E8F3CE] border border-[#CDE0A4] text-[#608216] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-4 inline-block">
                Security Core
              </span>
              <h2 className="text-3xl md:text-4xl font-normal text-slate-900 tracking-tight text-display mb-4 leading-tight">
                Trust is the product.
              </h2>
              <p className="text-slate-500 font-semibold text-sm leading-relaxed">
                Every design decision — from how a token is generated to who can see an audit log — starts from the assumption that someone, somewhere, is actively trying to defeat it.
              </p>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#E8F6FA] flex items-center justify-center text-[#0089C1] flex-shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 mb-1">Cryptographic Randomness</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">Tokens are generated, not guessed — and checked for collisions before issue.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#E8F6FA] flex items-center justify-center text-[#0089C1] flex-shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 mb-1">Signed verification tokens</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">Every code carries a signature that's checked on each scan, not just its existence.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#E8F6FA] flex items-center justify-center text-[#0089C1] flex-shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 mb-1">OTP on every check</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">No verification completes without confirming a real phone number.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#E8F6FA] flex items-center justify-center text-[#0089C1] flex-shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 mb-1">Rate limiting throughout</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">OTP requests, scans, and API calls are throttled to blunt automated abuse.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= PRICING SECTION ================= */}
        <section className="w-full max-w-6xl mx-auto px-6 py-20 relative z-20 border-t border-slate-200/80 scroll-mt-6" id="pricing">
          <div className="flex flex-col items-center text-center max-w-3xl mb-12 mx-auto">
            <span className="bg-[#E8F3CE] border border-[#CDE0A4] text-[#608216] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-4">
              Pricing Plans
            </span>
            <h2 className="text-3xl md:text-5xl font-normal text-slate-900 tracking-tight text-display mb-4 leading-tight">
              Flexible options, scaled to production.
            </h2>
            <p className="text-slate-500 font-semibold text-base max-w-xl leading-relaxed">
              Priced around how much you produce, not how many features you use. No lock-in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {/* Starter Plan */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 font-serif">Starter</h3>
                <p className="text-xs text-slate-500 mb-6">For a single brand getting its first codes into the market.</p>
                <div className="text-3xl font-bold text-slate-800 mb-6">₦150,000<span className="text-xs font-semibold text-slate-500">/month</span></div>
                <ul className="flex flex-col gap-3 text-xs text-slate-500 border-t border-slate-100 pt-6">
                  <li className="flex gap-2">✓ <span className="font-semibold">Up to 25,000 codes per month</span></li>
                  <li className="flex gap-2">✓ <span>Browser verification portal</span></li>
                  <li className="flex gap-2">✓ <span>Standard analytics</span></li>
                  <li className="flex gap-2">✓ <span>Email support</span></li>
                </ul>
              </div>
              <button className="w-full bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold py-3 rounded-full text-xs mt-8">
                Start here
              </button>
            </div>

            {/* Growth Plan - Featured */}
            <div className="bg-slate-800 text-white border-2 border-[#8BB436] rounded-3xl p-8 flex flex-col justify-between shadow-xl relative scale-105 z-10">
              <div className="absolute top-[-13px] left-8 bg-[#8BB436] text-white text-[8px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-slate-700">
                Most Chosen
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2 font-serif">Growth</h3>
                <p className="text-xs text-slate-300 mb-6">For producers scaling across states and retail partners.</p>
                <div className="text-3xl font-bold text-white mb-6">₦450,000<span className="text-xs font-semibold text-slate-300">/month</span></div>
                <ul className="flex flex-col gap-3 text-xs text-slate-300 border-t border-white/10 pt-6">
                  <li className="flex gap-2">✓ <span className="font-semibold text-white">Up to 250,000 codes per month</span></li>
                  <li className="flex gap-2">✓ <span>Fraud detection engine</span></li>
                  <li className="flex gap-2">✓ <span>Counterfeit investigation center</span></li>
                  <li className="flex gap-2">✓ <span>Priority support</span></li>
                </ul>
              </div>
              <button className="w-full bg-[#8BB436] hover:bg-[#729c25] text-white transition-all font-bold py-3 rounded-full text-xs mt-8 shadow-md">
                Talk to sales
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 font-serif">Enterprise</h3>
                <p className="text-xs text-slate-500 mb-6">For platforms running several brands or tenants at once.</p>
                <div className="text-3xl font-bold text-slate-800 mb-6">Custom</div>
                <ul className="flex flex-col gap-3 text-xs text-slate-500 border-t border-slate-100 pt-6">
                  <li className="flex gap-2">✓ <span className="font-semibold">Unlimited codes</span></li>
                  <li className="flex gap-2">✓ <span>Multi-tenant administration</span></li>
                  <li className="flex gap-2">✓ <span>Dedicated onboarding</span></li>
                  <li className="flex gap-2">✓ <span>SLA-backed support</span></li>
                </ul>
              </div>
              <button className="w-full bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold py-3 rounded-full text-xs mt-8">
                Contact us
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] font-bold text-slate-400 mt-10 uppercase tracking-widest">Figures above are illustrative and can be tailored to your production volume.</p>
        </section>



        {/* ================= FAQ SECTION ================= */}
        <section className="w-full max-w-3xl mx-auto px-6 py-20 relative z-20 border-t border-slate-200/80 scroll-mt-6" id="faq">
          <div className="flex flex-col items-center text-center max-w-3xl mb-12 mx-auto">
            <span className="bg-[#E8F3CE] border border-[#CDE0A4] text-[#608216] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-4">
              Questions &amp; Answers
            </span>
            <h2 className="text-3xl md:text-4xl font-normal text-slate-900 tracking-tight text-display mb-4 leading-tight">
              Before you ask, we probably already have.
            </h2>
          </div>

          <div className="flex flex-col gap-4 text-left">
            <details className="group border-b border-slate-200/80 pb-4" open>
              <summary className="text-base font-bold text-slate-800 cursor-pointer list-none flex justify-between items-center text-display">
                Does my customer need to install an app?
                <span className="text-[#0089C1] group-open:hidden">+</span>
                <span className="text-[#0089C1] hidden group-open:inline">−</span>
              </summary>
              <p className="text-xs text-slate-500 leading-relaxed mt-2 pl-2">
                No. Scanning the code opens a normal web page. The whole flow — phone number, OTP, result — happens in the browser they already have.
              </p>
            </details>
            <details className="group border-b border-slate-200/80 pb-4">
              <summary className="text-base font-bold text-slate-800 cursor-pointer list-none flex justify-between items-center text-display">
                What happens if someone scans a genuine code twice?
                <span className="text-[#0089C1] group-open:hidden">+</span>
                <span className="text-[#0089C1] hidden group-open:inline">−</span>
              </summary>
              <p className="text-xs text-slate-500 leading-relaxed mt-2 pl-2">
                A second scan of the same code isn't automatically treated as fraud. It's shown as "Previously Verified," and the risk engine looks at how, where and how often it's being repeated before deciding whether it's normal or worth flagging.
              </p>
            </details>
            <details className="group border-b border-slate-200/80 pb-4">
              <summary className="text-base font-bold text-slate-800 cursor-pointer list-none flex justify-between items-center text-display">
                What if a customer doesn't have a smartphone?
                <span className="text-[#0089C1] group-open:hidden">+</span>
                <span className="text-[#0089C1] hidden group-open:inline">−</span>
              </summary>
              <p className="text-xs text-slate-500 leading-relaxed mt-2 pl-2">
                The code can be typed into the verification page manually, and the OTP step still works over a basic SMS-capable phone.
              </p>
            </details>
            <details className="group border-b border-slate-200/80 pb-4">
              <summary className="text-base font-bold text-slate-800 cursor-pointer list-none flex justify-between items-center text-display">
                How do you catch counterfeits without physical inspection?
                <span className="text-[#0089C1] group-open:hidden">+</span>
                <span className="text-[#0089C1] hidden group-open:inline">−</span>
              </summary>
              <p className="text-xs text-slate-500 leading-relaxed mt-2 pl-2">
                By treating every scan as a data point, not just a lookup. Location, device, timing and repetition patterns across the whole platform reveal counterfeit activity that a single valid/invalid check would miss.
              </p>
            </details>
          </div>
        </section>

        {/* ================= CONTACT SECTION ================= */}
        <section className="w-full max-w-6xl mx-auto px-6 py-20 relative z-20 border-t border-slate-200/80 scroll-mt-6" id="contact">
          <div className="w-full bg-slate-800 text-white rounded-[32px] p-8 md:p-12 shadow-xl border border-slate-700 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-normal mb-4 text-white text-display">See it running on your own product.</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Send us a few details and we'll walk you through generating your first batch of codes and deploying your custom brand portal.
              </p>
            </div>
            {demoSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 p-8 rounded-2xl border border-white/10 text-center flex flex-col items-center gap-3"
              >
                <div className="text-3xl">🚀</div>
                <h3 className="text-sm font-bold text-white">Request Submitted Successfully</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Thank you for reaching out! We've received your inquiry and have dispatched a notification email. An AntiFakeNG expert will contact you shortly.
                </p>
                <button
                  onClick={() => setDemoSubmitted(false)}
                  className="mt-2 bg-[#8BB436] hover:bg-[#729c25] text-white transition-all font-bold py-2 px-6 rounded-full text-xs shadow-md"
                >
                  Send Another Request
                </button>
              </motion.div>
            ) : (
              <form className="flex flex-col gap-4 bg-white/5 p-6 rounded-2xl border border-white/10" onSubmit={handleDemoSubmit}>
                <input 
                  type="text" 
                  placeholder="Full name" 
                  value={demoName}
                  onChange={(e) => setDemoName(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#0089C1]" 
                  required 
                />
                <input 
                  type="text" 
                  placeholder="Company" 
                  value={demoCompany}
                  onChange={(e) => setDemoCompany(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#0089C1]" 
                  required 
                />
                <input 
                  type="email" 
                  placeholder="Work email" 
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#0089C1]" 
                  required 
                />
                <textarea 
                  placeholder="What products are you looking to authenticate?" 
                  rows={3} 
                  value={demoMessage}
                  onChange={(e) => setDemoMessage(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#0089C1] resize-none" 
                  required 
                />
                <button type="submit" className="bg-[#8BB436] hover:bg-[#729c25] text-white transition-all font-bold py-3 rounded-full text-xs shadow-md">
                  Send Request
                </button>
              </form>
            )}
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
            <a href="#how-it-works" className="text-xs font-semibold hover:text-[#0089C1] transition-colors">How it works</a>
            <a href="#features" className="text-xs font-semibold hover:text-[#0089C1] transition-colors">Features</a>
            <a href="#security" className="text-xs font-semibold hover:text-[#0089C1] transition-colors">Security</a>
            <a href="#pricing" className="text-xs font-semibold hover:text-[#0089C1] transition-colors">Pricing</a>
          </div>

          {/* Legal / Contact Column */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Connect</h4>
            <a href="mailto:hello@antifakeng.com" className="text-xs font-semibold hover:text-[#0089C1] transition-colors">hello@antifakeng.com</a>
            <a href="#contact" className="text-xs font-semibold hover:text-[#0089C1] transition-colors">Request a Demo</a>
            <span className="text-xs font-semibold mt-2 block text-slate-400">Lagos, Nigeria</span>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-300/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>&copy; {new Date().getFullYear()} AntiFakeNG. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
            <Link href="/compliance" className="hover:text-slate-600 transition-colors">Compliance Posture</Link>
          </div>
        </div>
      </footer>

      {/* CHATBOT WIDGET */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Chat Window */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200/60 w-[320px] sm:w-[360px] h-[450px] flex flex-col mb-4 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-[#1E293B] px-5 py-4 flex items-center justify-between text-white font-sans">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0089C1] flex items-center justify-center text-white">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 21m4.188-5.096L15 21M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-xs">AntiFakeNG Help Bot</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[9px] text-slate-300 font-semibold uppercase">Online assistant</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[#F8FAFC]">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-[#0089C1] text-white self-end rounded-tr-none" 
                        : "bg-white text-slate-700 border border-slate-100 self-start rounded-tl-none shadow-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                {chatLoading && (
                  <div className="bg-white text-slate-400 border border-slate-100 self-start rounded-2xl rounded-tl-none px-4 py-2.5 text-xs italic shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200"></span>
                    Thinking...
                  </div>
                )}
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-[#0089C1] transition-colors"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-4 rounded-xl text-xs transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="bg-[#0089C1] hover:bg-sky-600 text-white rounded-full p-4 shadow-xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 focus:outline-none"
        >
          {chatOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>
      </div>

    </div>
  );
}

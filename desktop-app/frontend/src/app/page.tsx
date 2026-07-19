"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/components/ahnara/AuthContext";
import { IconWifi, IconWifiOff, IconChevronRight, IconLock } from "@tabler/icons-react";

export default function SplashPage() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsOnline(window.navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen w-screen bg-[#E8EFF4] text-slate-800 font-sans flex flex-col items-center justify-between relative select-none px-6 py-6 overflow-y-auto">
      
      {/* Dynamic Grid Background Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cce2eb_1px,transparent_1px),linear-gradient(to_bottom,#cce2eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      {/* Top Header Bar with Connection Status and Sign In Button */}
      <header className="w-full max-w-5xl flex items-center justify-between z-50 mb-2">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="AntiFakeNG Logo" 
            className="w-8 h-8 object-contain drop-shadow-sm"
          />
          <span className="font-black text-xl tracking-tight text-slate-900 text-display">
            AntiFakeNG
          </span>
          <span className="text-[10px] font-black text-[#0089C1] uppercase tracking-widest bg-sky-100/80 px-2 py-0.5 rounded-full ml-1 border border-sky-200/50">
            Desktop
          </span>
        </div>

        {/* Connection Status Indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md transition-all duration-300 ${
          isOnline 
            ? "bg-emerald-50/80 border-emerald-200/60 text-emerald-700" 
            : "bg-rose-50/80 border-rose-200/60 text-rose-700"
        }`}>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isOnline ? "bg-emerald-500" : "bg-rose-500"
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              isOnline ? "bg-emerald-500" : "bg-rose-500"
            }`}></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest">
            {isOnline ? "Connected" : "Offline"}
          </span>
          {isOnline ? (
            <IconWifi className="w-3.5 h-3.5" />
          ) : (
            <IconWifiOff className="w-3.5 h-3.5" />
          )}
        </div>
      </header>

      {/* Center content */}
      <div className="z-10 flex-1 flex flex-col items-center justify-center max-w-5xl w-full text-center my-auto py-2">
        
        {/* Title */}
        <div className="flex flex-col items-center gap-1 mb-3">
          <h1 className="font-black text-2xl md:text-3xl tracking-tight text-slate-900 text-display">
            AntiFakeNG Desktop Companion
          </h1>
          <p className="text-xs font-semibold text-slate-600 max-w-md">
            Local print layout engine, cryptographically signed brand authentication & offline vector processing.
          </p>
        </div>

        {/* UI Screenshots */}
        <div className="w-full max-w-4xl mb-4 relative z-20 flex justify-center h-[42vh] max-h-[340px]">
          <div className="h-full relative aspect-[1.62] flex justify-center">
            <img 
              src="/ui_screenshot.png" 
              alt="AntiFakeNG Platform Dashboard" 
              className="h-full w-auto object-contain relative z-20 drop-shadow-md rounded-2xl" 
            />
            {/* Left Shape (3D Pill Bottle Mockup) */}
            <div className="absolute right-[12%] bottom-[10px] w-[15vh] h-[15vh] max-w-[110px] max-h-[110px] hidden md:block pointer-events-none z-30">
              <img 
                src="/pill_bottle_mockup.png" 
                alt="Secure Pill Container 3D Mockup" 
                className="w-full h-full object-contain drop-shadow-2xl rounded-3xl"
              />
            </div>

            {/* Right Shape (3D Pill Bottle Mockup 2) */}
            <div className="absolute right-[2%] bottom-[5px] w-[15vh] h-[15vh] max-w-[110px] max-h-[110px] hidden md:block pointer-events-none z-30">
              <img 
                src="/pill_bottle_mockup2.png" 
                alt="Secure Pill Container 3D Mockup Right" 
                className="w-full h-full object-contain drop-shadow-2xl rounded-3xl"
              />
            </div>
          </div>
        </div>

        {/* Main Action Auth Button */}
        <div className="w-full max-w-sm mt-1">
          {user ? (
            <Link href="/producer/dashboard" className="w-full block">
              <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm">
                Enter Brand Dashboard
                <IconChevronRight className="w-4 h-4" />
              </button>
            </Link>
          ) : (
            <Link href="/login" className="w-full block">
              <button className="w-full bg-[#0089C1] hover:bg-sky-600 text-white font-extrabold py-3 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm">
                <IconLock className="w-4 h-4" />
                Sign In to Brand Dashboard
              </button>
            </Link>
          )}
        </div>

      </div>

      {/* Footer watermark */}
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
        AntiFakeNG v2.13.0
      </div>

    </div>
  );
}

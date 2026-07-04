"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Home, 
  Briefcase, 
  Map as MapIcon, 
  Wallet, 
  User, 
  Bell,
  Menu,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AhnaraThemeToggle } from "./AhnaraThemeToggle";
import { AhnaraAvatar } from "./AhnaraAvatar";

export const TechNavbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-16 liquid-glass border-b border-ahnara-border px-4">
      <div className="container mx-auto h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/tech/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ahnara-accent rounded-lg flex items-center justify-center text-white">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-display hidden sm:block">AhnaraStaff</span>
          </Link>
          <div className="h-4 w-px bg-ahnara-border mx-2 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-ahnara-accent/10 rounded-full border border-ahnara-accent/20">
            <span className="w-2 h-2 rounded-full bg-ahnara-accent animate-pulse" />
            <span className="text-[10px] font-black text-ahnara-accent uppercase tracking-widest">NX-881920</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AhnaraThemeToggle />
          <div className="relative p-2 hover:bg-ahnara-bg-base rounded-xl cursor-pointer">
             <Bell className="w-5 h-5 text-ahnara-text-secondary" />
             <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
          </div>
          <AhnaraAvatar size="sm" isOnline />
        </div>
      </div>
    </nav>
  );
};

export const TechBottomNav = () => {
  const pathname = usePathname();
  
  const tabs = [
    { icon: <Home />, label: "Home", href: "/tech/dashboard" },
    { icon: <Briefcase />, label: "Jobs", href: "/tech/jobs" },
    { icon: <MapIcon />, label: "Map", href: "/tech/map" },
    { icon: <Wallet />, label: "Earnings", href: "/tech/earnings" },
    { icon: <User />, label: "Profile", href: "/tech/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 liquid-glass rounded-t-3xl shadow-[0_-3px_8px_rgba(0,0,0,0.04)] px-2 pb-safe border-t border-ahnara-accent/10">
      <div className="flex items-center justify-around h-20">
        {tabs.map((tab, i) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link key={i} href={tab.href} className="flex-1">
              <button
                className={cn(
                  "relative flex flex-col items-center justify-center w-full h-full transition-all duration-300",
                  isActive ? "text-ahnara-accent scale-110" : "text-ahnara-text-faint hover:text-ahnara-text-secondary"
                )}
              >
                <div className={cn(
                  "p-2 rounded-2xl transition-all",
                  isActive && "bg-ahnara-accent/10"
                )}>
                  {React.cloneElement(tab.icon as React.ReactElement<any>, {
                    className: cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"),
                  })}
                </div>
                {isActive && (
                  <motion.div
                    layoutId="tech-active-indicator"
                    className="absolute bottom-2 w-1 h-1 rounded-full bg-ahnara-accent"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className={cn("text-[9px] mt-1 font-bold uppercase tracking-wider", !isActive && "opacity-0")}>
                  {tab.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

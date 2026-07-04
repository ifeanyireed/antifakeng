"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  IconLayoutDashboard,
  IconLayoutDashboardFilled,
  IconAlertOctagon,
  IconAlertTriangle,
  IconBox,
  IconBoxOff,
  IconQrcode,
  IconClock,
  IconFileText,
  IconBell,
  IconSettings
} from "@tabler/icons-react";

export default function ProducerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/producer/dashboard", icon: IconLayoutDashboard, activeIcon: IconLayoutDashboardFilled },
    { name: "Products", href: "/producer/products", icon: IconBox, activeIcon: IconBox },
    { name: "Batches", href: "/producer/batches", icon: IconQrcode, activeIcon: IconQrcode },
    { name: "Alerts", href: "/producer/alerts", icon: IconAlertOctagon, activeIcon: IconAlertTriangle },
    { name: "History", href: "/producer/history", icon: IconClock, activeIcon: IconClock },
    { name: "Reports", href: "/producer/reports", icon: IconFileText, activeIcon: IconFileText },
  ];

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col select-none">
      
      {/* TOP HEADER - Matching Ahnara's exact style */}
      <header className="px-8 py-5 flex items-center justify-between gap-4 bg-transparent border-none">
        
        {/* Logo and Nav Menu Group */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />

          {/* Navigation Tab Menu - Matches Header Capsule Tab physics */}
          <nav className="flex items-center gap-1 bg-[#DDEEF3] p-1 rounded-2xl border border-slate-300/30">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 z-10 ${
                    isActive ? "text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="producerActiveTabBackground"
                      className="absolute inset-0 bg-[#1E293B] rounded-xl -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="w-5 h-5" />
                  <span className="hidden xl:inline">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Notifications and Profile */}
        <div className="flex items-center gap-4">
          <span className="hidden md:flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            Plan: Standard
          </span>

          <Link href="/producer/notifications">
            <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all relative bg-white shadow-xs">
              <IconBell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
          </Link>
          
          <div className="h-8 w-px bg-slate-200" />
          
          <Link href="/producer/profile" className="flex items-center gap-3 hover:opacity-85 transition-all cursor-pointer">
            <img
              src="/character3.jpg"
              alt="Profile Avatar"
              className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
            />
            <div className="text-left hidden sm:block">
              <p className="font-bold text-sm text-slate-900 leading-none">Aura Labs Inc</p>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">
                Producer Account
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* MAIN SCREEN WORKSPACE CONTAINER */}
      <div className="flex-1 px-8 pt-6 pb-6 flex flex-col">
        {children}
      </div>

    </div>
  );
}

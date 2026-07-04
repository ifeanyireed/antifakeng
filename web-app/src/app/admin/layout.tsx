"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  IconLayoutDashboard,
  IconLayoutDashboardFilled,
  IconBuildingStore,
  IconAlertTriangle,
  IconFileText,
  IconBell,
  IconSettings
} from "@tabler/icons-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { name: "SaaS Dashboard", href: "/admin/dashboard", icon: IconLayoutDashboard, activeIcon: IconLayoutDashboardFilled },
    { name: "Producers & Tenants", href: "/admin/producers", icon: IconBuildingStore, activeIcon: IconBuildingStore },
    { name: "Global Fraud Center", href: "/admin/fraud", icon: IconAlertTriangle, activeIcon: IconAlertTriangle },
    { name: "System Audit Logs", href: "/admin/logs", icon: IconFileText, activeIcon: IconFileText },
  ];

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col select-none">
      
      {/* TOP HEADER - Matches Provider layout */}
      <header className="px-8 py-5 flex items-center justify-between gap-4 bg-transparent border-none">
        
        {/* Logo and Nav Menu Group */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />

          {/* Navigation Tab Menu - Admin specific */}
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
                      layoutId="adminActiveTabBackground"
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
          <span className="hidden md:flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
            System Live: 100% OK
          </span>

          <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all relative bg-white shadow-xs">
            <IconBell className="w-5 h-5" />
          </button>
          
          <div className="h-8 w-px bg-slate-200" />
          
          <div className="flex items-center gap-3">
            <img
              src="/character4.jpg"
              alt="Profile Avatar"
              className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
            />
            <div className="text-left hidden sm:block">
              <p className="font-bold text-sm text-slate-900 leading-none">Super Admin</p>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">
                System Console
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN SCREEN WORKSPACE CONTAINER */}
      <div className="flex-1 px-8 pt-6 pb-6 flex flex-col">
        {children}
      </div>

    </div>
  );
}

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
  IconSettings,
  IconLogout,
  IconInbox
} from "@tabler/icons-react";
import { RoleGuard } from "@/components/ahnara/RoleGuard";
import { useAuth } from "@/components/ahnara/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const menuItems = [
    { name: "SaaS Dashboard", href: "/admin/dashboard", icon: IconLayoutDashboard, activeIcon: IconLayoutDashboardFilled },
    { name: "Producers & Tenants", href: "/admin/producers", icon: IconBuildingStore, activeIcon: IconBuildingStore },
    { name: "Global Fraud Center", href: "/admin/fraud", icon: IconAlertTriangle, activeIcon: IconAlertTriangle },
    { name: "Inbound Requests", href: "/admin/submissions", icon: IconInbox, activeIcon: IconInbox },
    { name: "System Audit Logs", href: "/admin/logs", icon: IconFileText, activeIcon: IconFileText },
  ];

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
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
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-[#1E293B] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/20"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden xl:inline">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Notifications and Profile */}
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/notifications"
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all relative bg-white shadow-xs"
            >
              <IconBell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </Link>
            
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

            <button
              onClick={logout}
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all bg-white shadow-xs"
              title="Logout"
            >
              <IconLogout className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* MAIN SCREEN WORKSPACE CONTAINER */}
        <div className="flex-1 px-8 pt-6 pb-6 flex flex-col">
          {children}
        </div>

      </div>
    </RoleGuard>
  );
}

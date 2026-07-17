"use client";

import React from "react";
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Users, 
  AlertCircle, 
  Settings, 
  Search,
  Bell,
  LogOut,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AhnaraThemeToggle } from "./AhnaraThemeToggle";
import { AhnaraAvatar } from "./AhnaraAvatar";
import { useAuth } from "./AuthContext";

export const OpsSidebar = () => {
  const pathname = usePathname();
  const { logout } = useAuth();
  
  const menuItems = [
    { label: "Dispatch", icon: <MapIcon className="w-5 h-5" />, href: "/ops/assignments" },
    { label: "Tech Directory", icon: <Users className="w-5 h-5" />, href: "/ops/technicians" },
    { label: "Dispute Manager", icon: <ShieldAlert className="w-5 h-5" />, href: "/ops/disputes", badge: "4" },
  ];

  return (
    <aside className="w-20 lg:w-64 bg-[#0B1120] border-r border-white/5 flex flex-col h-screen sticky top-0 z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#1E3A5F] rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-500/10">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="hidden lg:block">
           <h1 className="text-sm font-black text-white uppercase tracking-widest">AhnaraOps</h1>
           <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Command Center</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-8">
        {menuItems.map((item, i) => {
          const isActive = pathname === item.href;
          return (
            <Link href={item.href} key={i}>
              <button
                className={cn(
                  "w-full flex items-center gap-4 p-3 rounded-xl transition-all group mb-1",
                  isActive ? "bg-[#1E3A5F] text-white shadow-lg" : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className={cn("transition-transform group-hover:scale-110", isActive ? "text-blue-400" : "text-slate-500")}>
                  {item.icon}
                </div>
                <div className="hidden lg:flex flex-1 items-center justify-between text-left">
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-2">
         <button className="w-full flex items-center gap-4 p-3 rounded-xl text-slate-400 hover:bg-white/5 transition-all">
            <Settings className="w-5 h-5" />
            <span className="hidden lg:block font-bold text-sm">Settings</span>
         </button>
         <button onClick={logout} className="w-full flex items-center gap-4 p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all">
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block font-bold text-sm">Logout</span>
         </button>
      </div>
    </aside>
  );
};

export const OpsHeader = () => {
  return (
    <header className="h-16 bg-[#0B1120]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 px-8 flex items-center justify-between">
      <div className="flex items-center gap-6">
         <div className="hidden lg:flex items-center bg-white/5 px-4 py-1.5 rounded-lg border border-white/10 gap-3 w-80">
            <Search className="w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search jobs, techs, or tickets..." className="bg-transparent text-xs text-white outline-none w-full" />
         </div>
      </div>

      <div className="flex items-center gap-6">
         <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">System Live</span>
         </div>
         <div className="relative p-2 hover:bg-white/5 rounded-xl cursor-pointer">
            <Bell className="w-5 h-5 text-slate-400" />
            <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0B1120]" />
         </div>
         <div className="h-6 w-px bg-white/10" />
         <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
               <p className="text-xs font-bold text-white">Ops Admin</p>
               <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest">Level 3 Dispatcher</p>
            </div>
            <AhnaraAvatar size="sm" />
         </div>
      </div>
    </header>
  );
};

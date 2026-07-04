"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, ChevronDown, Menu, User, Home, Grid, PlusSquare, Bell, Compass, LayoutGrid, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AhnaraButton } from "./AhnaraButton";
import { AhnaraThemeToggle } from "./AhnaraThemeToggle";
import { AhnaraAvatar } from "./AhnaraAvatar";
import { AhnaraModeToggle } from "./AhnaraModeToggle";
import { useNiche } from "./NicheContext";
import { NicheSwitcher } from "./NicheSwitcher";
import { useAuth } from "./AuthContext";
import { LocationDropdown } from "./LocationDropdown";

export const AhnaraNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const { mode, setMode } = useNiche();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300 !overflow-visible",
          scrolled ? "h-16 liquid-glass shadow-lg" : "h-20 bg-transparent"
        )}
      >
        {/* Translucent blurry white overlay for contrast when scrolled */}
        <div 
          className={cn(
            "absolute inset-0 bg-white/70 backdrop-blur-md transition-opacity duration-300 pointer-events-none -z-10",
            scrolled ? "opacity-100" : "opacity-0"
          )}
        />
        <div className="container mx-auto h-full px-4 flex items-center justify-between">
          {/* LOGO & NICHE SWITCHER */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 cursor-pointer group">
              <img src="/logo.png" alt="Ahnara Logo" className="w-8 h-8 object-contain transition-all group-hover:scale-110" />
              <span className="text-xl font-bold text-display text-ahnara-text-primary hidden sm:block">
                Ahnara
              </span>
            </Link>
            
            <button 
              onClick={() => setIsSwitcherOpen(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-ahnara-bg-glass transition-colors group"
            >
              <LayoutGrid className="w-4 h-4 text-ahnara-text-faint group-hover:text-ahnara-brand transition-colors" />
              <span className="text-sm font-bold text-ahnara-text-secondary">Explore Niches</span>
            </button>
          </div>

          {/* MODE TOGGLE - DESKTOP */}
          <div className="hidden lg:block">
            <AhnaraModeToggle mode={mode} onChange={setMode} />
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-3">
            <LocationDropdown className="hidden md:block mr-2" />
            
            <Link href="/ahnara-verified" className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-ahnara-amber/10 transition-colors group">
               <ShieldCheck className="w-4 h-4 text-ahnara-amber" />
               <span className="text-xs font-black text-ahnara-amber uppercase tracking-wider">Verified</span>
            </Link>
            <div className="hidden sm:flex items-center gap-3">
              {user ? (
                <>
                  <Link href="/dashboard">
                    <AhnaraButton size="sm" leftIcon={<Grid className="w-4 h-4" />}>
                      Dashboard
                    </AhnaraButton>
                  </Link>
                  <div className="flex items-center gap-2">
                    <AhnaraAvatar size="sm" isOnline name={user.name} />
                    <button onClick={logout} className="text-xs font-bold text-ahnara-text-faint hover:text-red-500 transition-colors">
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {mode === "seller" ? (
                    <Link href="/join">
                      <AhnaraButton size="sm" leftIcon={<PlusSquare className="w-4 h-4" />}>
                        List Business
                      </AhnaraButton>
                    </Link>
                  ) : (
                    <Link href="/join">
                      <AhnaraButton variant="ghost" size="sm" className="text-ahnara-text-secondary">
                        List Business
                      </AhnaraButton>
                    </Link>
                  )}
                  <Link href="/login">
                    <AhnaraButton variant="secondary" size="sm" leftIcon={<User className="w-4 h-4" />}>
                      Sign In
                    </AhnaraButton>
                  </Link>
                </>
              )}
            </div>
            {user ? (
              <Link href="/account">
                <AhnaraAvatar size="sm" isOnline name={user.name} className="sm:hidden" />
              </Link>
            ) : (
              <AhnaraAvatar size="sm" className="sm:hidden" />
            )}
            <button className="lg:hidden p-2 text-ahnara-text-primary">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      <NicheSwitcher isOpen={isSwitcherOpen} onClose={() => setIsSwitcherOpen(false)} />
    </>
  );
};

export const AhnaraBottomBar = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { mode, setMode } = useNiche();
  const { user } = useAuth();

  const tabs = [
    { icon: <Home />, label: "Home", href: "/" },
    { icon: <Compass />, label: "Discover", href: "/categories" },
    { icon: <PlusSquare />, label: "Join", href: "/join" },
    { icon: <Bell />, label: "Alerts", href: "/account?tab=settings" },
    { icon: <User />, label: "Account", href: user ? "/account" : "/login" },
  ];

  return (
    <>
      {/* FLOATING MODE TOGGLE - MOBILE */}
      <div className="fixed bottom-24 right-4 z-40 lg:hidden">
        <AhnaraModeToggle mode={mode} onChange={setMode} className="shadow-2xl scale-90 origin-right" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden liquid-glass rounded-t-2xl shadow-[0_-3px_8px_rgba(0,0,0,0.03)] px-2 pb-safe">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab, i) => (
            <Link key={i} href={tab.href}>
              <button
                className={cn(
                  "relative flex flex-col items-center justify-center w-12 h-12 transition-colors",
                  activeTab === i ? "text-ahnara-brand" : "text-ahnara-text-faint"
                )}
              >
                {React.cloneElement(tab.icon as React.ReactElement<any>, {
                  className: "w-6 h-6",
                })}
                {activeTab === i && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute -top-1 w-1 h-1 rounded-full bg-ahnara-brand"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
              </button>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

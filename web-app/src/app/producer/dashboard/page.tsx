"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  IconCheck,
  IconShieldCheck,
  IconAlertOctagon,
  IconQrcode,
  IconTrendingUp,
  IconChevronRight,
  IconMapPin,
  IconDeviceMobile,
  IconArrowUpRight
} from "@tabler/icons-react";
import Link from "next/link";

export default function ProducerDashboard() {
  const [timeframe, setTimeframe] = useState("7d");

  // Mock stats
  const stats = [
    { name: "Total Serial Scans", value: "24,812", change: "+12.4%", icon: IconQrcode, color: "text-[#0089C1]", bg: "bg-sky-50" },
    { name: "Genuine Confirmations", value: "23,410", change: "94.3%", icon: IconShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "Counterfeit Alerts", value: "8", change: "+2 today", icon: IconAlertOctagon, color: "text-red-600", bg: "bg-red-50" },
    { name: "Products In Catalog", value: "14", change: "4 categories", icon: IconTrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  // Mock scan logs
  const recentScans = [
    { product: "AURA Skincare Serum", location: "Ikeja, Lagos", time: "2 mins ago", verdict: "genuine" },
    { product: "AURA Skincare Serum", location: "Garki, Abuja", time: "12 mins ago", verdict: "previously_verified" },
    { product: "AURA Cleanser 100ml", location: "Surulere, Lagos", time: "24 mins ago", verdict: "genuine" },
    { product: "Hydra Essence", location: "Kano City", time: "45 mins ago", verdict: "suspicious" },
    { product: "AURA Skincare Serum", location: "Lekki, Lagos", time: "1 hour ago", verdict: "genuine" },
  ];

  // Mock alerts list
  const activeAlerts = [
    { id: "A-201", product: "AURA Skincare Serum", location: "Wuse, Abuja", riskScore: 88, scans: 14, time: "July 04, 10:14 AM" },
    { id: "A-202", product: "Hydra Essence", location: "Kano Main Market", riskScore: 75, scans: 6, time: "July 03, 05:42 PM" },
  ];

  // Mock weekly scan volume chart data (CSS layout columns)
  const chartData = [
    { day: "Mon", scans: 1200 },
    { day: "Tue", scans: 1450 },
    { day: "Wed", scans: 1800 },
    { day: "Thu", scans: 1650 },
    { day: "Fri", scans: 2100 },
    { day: "Sat", scans: 1950 },
    { day: "Sun", scans: 2450 },
  ];
  
  const maxScans = Math.max(...chartData.map(d => d.scans));

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
      
      {/* LEFT/CENTER PANELS (8 COLS) */}
      <main className="lg:col-span-8 flex flex-col gap-6">
        
        {/* GREETING ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight text-display">Aura Labs Dashboard</h2>
            <p className="text-slate-500 font-medium mt-1">
              Live status dashboard of your product authenticity checks and threat signals.
            </p>
          </div>
          
          {/* Timeframe selector */}
          <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-300/35">
            {["24h", "7d", "30d"].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeframe === t ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{stat.name}</span>
                  <div className={`w-8 h-8 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block uppercase tracking-wider">{stat.change}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* TIME SERIES SCAN CHART */}
        <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Weekly Scan Volumes</span>
            <span className="text-xs text-slate-600 font-bold">Average: 1,800/Day</span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-4 border-b border-slate-100">
            {chartData.map((d) => {
              const barHeight = `${(d.scans / maxScans) * 100}%`;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[10px] font-black text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.scans}
                  </div>
                  <div 
                    style={{ height: barHeight }} 
                    className="w-full bg-[#E8F6FA] hover:bg-[#0089C1] rounded-t-xl transition-all duration-300 relative"
                  />
                  <span className="text-[10px] font-bold text-slate-400 mt-1">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RECENT SCAN AUDIT TRAIL */}
        <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Real-Time Verification Feed</span>
            <Link href="/producer/history" className="text-xs font-bold text-[#0089C1] flex items-center gap-1">
              View History <IconChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {recentScans.map((scan, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/40">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="text-left">
                    <h4 className="text-xs font-black text-slate-800">{scan.product}</h4>
                    <span className="text-[10px] text-slate-400 font-bold block">{scan.location} • {scan.time}</span>
                  </div>
                </div>
                
                {/* Verdict Badge */}
                <span className={`px-2.5 py-1 rounded-lg font-mono text-[9px] uppercase font-black ${
                  scan.verdict === "genuine" 
                    ? "bg-emerald-50 text-emerald-600" 
                    : scan.verdict === "previously_verified"
                    ? "bg-yellow-50 text-yellow-600"
                    : "bg-red-50 text-red-600"
                }`}>
                  {scan.verdict.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* RIGHT SIDEBAR (4 COLS) */}
      <aside className="lg:col-span-4 flex flex-col gap-6">
        
        {/* COUNTERFEIT MAP MINI */}
        <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 shadow-sm flex flex-col gap-4 text-left">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Live Threat Intel</span>
          <div className="h-44 w-full bg-[#E8EFF4] rounded-2xl relative overflow-hidden flex items-center justify-center border border-slate-200/40">
            {/* Map visual background */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#0089C1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-900" />
            <div className="absolute top-1/3 left-1/2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
            <div className="absolute top-1/3 left-1/2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
            <div className="absolute bottom-2.5 right-2.5 bg-[#1E293B] text-white px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider">
              Hotspot: Wuse, Abuja
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
            Live telemetry reports a cluster of duplicate serial checks originating from a pharmacy point in Abuja.
          </p>
        </div>

        {/* ACTIVE ALERTS CASES */}
        <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Investigations</span>
            <Link href="/producer/alerts" className="text-xs font-bold text-red-500">
              Alerts Center
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className="border border-red-100 rounded-2xl p-4 bg-red-50/20 text-left flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded font-mono text-[9px] font-bold">
                    {alert.id} • RISK: {alert.riskScore}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">{alert.time}</span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800">{alert.product}</h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">Location: {alert.location}</p>
                  <p className="text-[10px] text-red-600 font-bold mt-1">{alert.scans} scans flagged in last hour</p>
                </div>
                <Link href="/producer/alerts">
                  <button className="w-full bg-[#1E293B] text-white hover:bg-slate-800 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1">
                    Investigate Threat
                    <IconArrowUpRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>

      </aside>

    </div>
  );
}

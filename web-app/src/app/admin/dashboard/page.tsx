"use client";

import React from "react";
import {
  IconBuildingStore,
  IconQrcode,
  IconAlertTriangle,
  IconActivity,
  IconCheck,
  IconInfoCircle,
  IconLock
} from "@tabler/icons-react";

export default function AdminDashboard() {
  const stats = [
    { name: "Active Producers", value: "24 Brands", detail: "+2 registered this week", icon: IconBuildingStore, color: "text-[#0089C1]", bg: "bg-sky-50" },
    { name: "Total Serial Inventory", value: "14.2M Codes", detail: "99.999% cryptographic entropy", icon: IconQrcode, color: "text-purple-600", bg: "bg-purple-50" },
    { name: "Global Threat Incidents", value: "128 Flags", detail: "14 active investigations", icon: IconAlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    { name: "API Request Speed", value: "48ms Avg", detail: "99.99% uptime SLA", icon: IconActivity, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  const recentIncidents = [
    { brand: "Aura Labs Inc", type: "Impossible Travel Velocity", detail: "Abuja and Lagos overlap", severity: "HIGH", time: "10 mins ago" },
    { brand: "Vitals Pharma Co", type: "Signature Verification Failure", detail: "Unsigned public token checked", severity: "CRITICAL", time: "25 mins ago" },
    { brand: "Aura Labs Inc", type: "Multiple Device Footprints", detail: "1 token checked by 6 devices", severity: "MEDIUM", time: "1 hour ago" },
  ];

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
      
      {/* Main Column (8 cols) */}
      <main className="lg:col-span-8 flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight text-display">SaaS Administration</h2>
          <p className="text-slate-500 font-medium mt-1">
            Global management portal of multi-tenant producers, cryptographic key logs, and network health.
          </p>
        </div>

        {/* METRICS GRID */}
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
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block uppercase tracking-wider">{stat.detail}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ACTIVE INCIDENTS BLOCK */}
        <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 shadow-sm flex flex-col gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cross-Brand Incident Feed</span>
          
          <div className="flex flex-col gap-3">
            {recentIncidents.map((inc, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/40 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{inc.brand}</span>
                  <h4 className="text-xs font-black text-slate-800 mt-0.5">{inc.type}</h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">{inc.detail}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                    inc.severity === "CRITICAL"
                      ? "bg-red-100 text-red-700 animate-pulse"
                      : inc.severity === "HIGH"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {inc.severity}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">{inc.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Sidebar Column (4 cols) */}
      <aside className="lg:col-span-4 flex flex-col gap-6">
        
        {/* System Load */}
        <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 shadow-sm flex flex-col gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">System Node Status</span>
          
          <div className="flex flex-col gap-3.5 text-xs font-semibold text-slate-600">
            <div>
              <div className="flex justify-between mb-1">
                <span>CPU Load</span>
                <span className="font-bold text-slate-800">14%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "14%" }} />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span>Database Connections</span>
                <span className="font-bold text-slate-800">42 / 200</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#0089C1] h-full rounded-full" style={{ width: "21%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Memory Allocation</span>
                <span className="font-bold text-slate-800">1.8 GB / 8 GB</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: "22%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Database Stats */}
        <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 shadow-sm flex flex-col gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Database Summary</span>
          
          <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
            <div>
              <span className="text-slate-400 text-[10px] uppercase block tracking-wider">Total Scans Logged</span>
              <p className="text-sm font-black text-slate-800 mt-0.5">8.4M rows</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block tracking-wider">Storage Index Size</span>
              <p className="text-sm font-black text-slate-800 mt-0.5">2.4 GB</p>
            </div>
          </div>
        </div>

      </aside>

    </div>
  );
}

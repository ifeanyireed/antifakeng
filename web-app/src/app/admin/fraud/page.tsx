"use client";

import React, { useState } from "react";
import {
  IconSearch,
  IconAlertTriangle,
  IconMapPin,
  IconClock,
  IconBuildingStore,
  IconCheck
} from "@tabler/icons-react";

export default function AdminFraud() {
  const [incidents, setIncidents] = useState([
    { id: "FI-901", brand: "Vitals Pharma Co", type: "Signature Failure", details: "142 scans of unsigned serial token registered from Abuja retail point.", status: "Critical", time: "12 mins ago" },
    { id: "FI-902", brand: "Aura Labs Inc", type: "Impossible Travel", details: "Duplicate checking of token 9F3C-71AE between Lagos & Abuja inside 10 mins.", status: "High", time: "24 mins ago" },
    { id: "FI-903", brand: "Aura Labs Inc", type: "High-Volume Re-scans", details: "Single code verified 45 times by different user agents in Kano Main Market.", status: "High", time: "1 hour ago" },
    { id: "FI-904", brand: "PharmaCare Labs", type: "Device Fingerprint Mismatch", details: "Cloned packaging warning triggered by coordinate repetitions in Port Harcourt.", status: "Medium", time: "3 hours ago" }
  ]);

  const handleResolveIncident = (id: string) => {
    setIncidents(prev => prev.filter(i => i.id !== id));
    alert(`Incident ${id} marked as resolved and removed from global active thread tracker.`);
  };

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight text-display">Global Fraud Center</h2>
          <p className="text-slate-500 font-medium mt-1">
            Aggregated cross-brand fraud detection alerts, impossible travel markers, and signature validation failures.
          </p>
        </div>
      </div>

      {/* Global Map & Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Threat Map (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/60 rounded-[32px] p-6 shadow-sm flex flex-col gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Global Hotspots Map</span>
          <div className="h-64 w-full bg-[#E8EFF4] rounded-2xl relative overflow-hidden flex items-center justify-center border border-slate-200/40">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#0089C1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-900" />
            
            {/* Pulsing Hotspots */}
            <div className="absolute top-1/3 left-1/2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
            <div className="absolute top-1/3 left-1/2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
            <span className="absolute top-1/3 left-1/2 translate-x-3 -translate-y-2 text-[9px] font-bold text-white bg-slate-900 px-1 rounded">Abuja Cluster</span>

            <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-red-500 rounded-full border border-white" />
            <span className="absolute top-1/2 left-1/3 translate-x-3 -translate-y-2 text-[9px] font-bold text-white bg-slate-900 px-1 rounded">Lagos Cluster</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500 font-bold border-t border-slate-100 pt-3">
            <span>Critical Hotspots: 2</span>
            <span className="text-red-500">Global Threat Index: HIGH</span>
          </div>
        </div>

        {/* Incidents Table (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/60 rounded-[32px] overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <IconSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by brand name..."
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0089C1] focus:bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Tenant Brand</th>
                  <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Issue Type</th>
                  <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Details</th>
                  <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Severity</th>
                  <th className="p-4 font-mono uppercase text-slate-400 tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                      <IconBuildingStore className="w-4 h-4 text-slate-400" />
                      {inc.brand}
                    </td>
                    <td className="p-4 font-bold text-slate-800">{inc.type}</td>
                    <td className="p-4 max-w-xs text-slate-500 font-semibold leading-relaxed truncate">{inc.details}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                        inc.status === "Critical"
                          ? "bg-red-50 text-red-600 border-red-100 animate-pulse"
                          : inc.status === "High"
                          ? "bg-orange-50 text-orange-600 border-orange-100"
                          : "bg-yellow-50 text-yellow-600 border-yellow-100"
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleResolveIncident(inc.id)}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors font-bold text-[10px] uppercase flex items-center gap-1 justify-end ml-auto"
                      >
                        <IconCheck className="w-3.5 h-3.5" />
                        Clear
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}

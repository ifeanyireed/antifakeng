"use client";

import React, { useState } from "react";
import {
  IconSearch,
  IconClock,
  IconMapPin,
  IconDeviceMobile,
  IconFilter
} from "@tabler/icons-react";

export default function ProducerHistory() {
  const [logs, setLogs] = useState([
    { token: "9F3C-71AE", product: "AURA Skincare Serum 50ml", ip: "197.210.64.12", country: "Nigeria", city: "Ikeja", device: "iOS Safari", date: "July 04, 12:42 PM", verdict: "genuine" },
    { token: "9F3C-71AE", product: "AURA Skincare Serum 50ml", ip: "102.82.4.90", country: "Nigeria", city: "Abuja", device: "Android Chrome", date: "July 04, 12:40 PM", verdict: "previously_verified" },
    { token: "3B1C-49DA", product: "AURA Cleanser 100ml", ip: "197.210.82.5", country: "Nigeria", city: "Lekki", device: "iOS Safari", date: "July 04, 11:15 AM", verdict: "genuine" },
    { token: "8C2D-04EE", product: "Hydra Essence", ip: "41.203.77.21", country: "Nigeria", city: "Kano", device: "Android Chrome", date: "July 04, 10:45 AM", verdict: "suspicious" },
    { token: "9F3C-71AE", product: "AURA Skincare Serum 50ml", ip: "102.82.4.90", country: "Nigeria", city: "Abuja", device: "Android Chrome", date: "July 04, 10:14 AM", verdict: "previously_verified" },
    { token: "9F3C-71AE", product: "AURA Skincare Serum 50ml", ip: "197.210.64.12", country: "Nigeria", city: "Ikeja", device: "iOS Safari", date: "July 04, 09:30 AM", verdict: "genuine" }
  ]);

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight text-display">Verification Scan History</h2>
          <p className="text-slate-500 font-medium mt-1">
            Complete, immutable audit trail of consumer verification attempts across all batches.
          </p>
        </div>
      </div>

      {/* History Table Card */}
      <div className="bg-white border border-slate-200/60 rounded-[32px] overflow-hidden shadow-sm flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search serial token or IP..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0089C1] focus:bg-white"
            />
          </div>
          
          <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors">
            <IconFilter className="w-4 h-4" />
            Filter Logs
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Timestamp</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Serial Token</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Product Name</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">IP Address</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Location</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">User Device</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider text-right">Scan Verdict</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-semibold text-slate-400 flex items-center gap-2">
                    <IconClock className="w-4 h-4 text-slate-300" />
                    {log.date}
                  </td>
                  <td className="p-4 font-mono font-bold text-[#0089C1]">{log.token}</td>
                  <td className="p-4 font-bold text-slate-700">{log.product}</td>
                  <td className="p-4 font-mono font-semibold text-slate-500">{log.ip}</td>
                  <td className="p-4 font-bold text-slate-600 flex items-center gap-1">
                    <IconMapPin className="w-3.5 h-3.5 text-slate-400" />
                    {log.city}, {log.country}
                  </td>
                  <td className="p-4 font-semibold text-slate-400 flex items-center gap-1.5">
                    <IconDeviceMobile className="w-3.5 h-3.5 text-slate-400" />
                    {log.device}
                  </td>
                  <td className="p-4 text-right">
                    <span className={`px-2.5 py-1 rounded-lg font-mono text-[9px] uppercase font-black ${
                      log.verdict === "genuine" 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                        : log.verdict === "previously_verified"
                        ? "bg-yellow-50 text-yellow-600 border border-yellow-100"
                        : "bg-red-50 text-red-600 border border-red-100"
                    }`}>
                      {log.verdict.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

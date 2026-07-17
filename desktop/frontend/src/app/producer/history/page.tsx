"use client";

import React, { useState, useEffect } from "react";
import {
  IconSearch,
  IconClock,
  IconMapPin,
  IconDeviceMobile,
  IconFilter
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { AhnaraLoader } from "@/components/ahnara/AhnaraLoader";

export default function ProducerHistory() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const data = await api.get("/analytics/history");
        setLogs(data || []);
      } catch (err) {
        console.error("Failed to load verification history:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredLogs = logs.filter((log: any) => {
    const q = searchQuery.toLowerCase();
    return (
      (log.token || "").toLowerCase().includes(q) ||
      (log.product_name || "").toLowerCase().includes(q) ||
      (log.ip_country || "").toLowerCase().includes(q) ||
      (log.device_id || "").toLowerCase().includes(q) ||
      (log.result || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full flex flex-col gap-6 text-left animate-fade-in">
      
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
              placeholder="Search serial token, product, device or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0089C1] focus:bg-white"
            />
          </div>
          
          <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors">
            <IconFilter className="w-4 h-4" />
            Filter Logs
          </button>
        </div>

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4">
            <AhnaraLoader label="Loading Scan Logs..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Timestamp</th>
                  <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Serial Token</th>
                  <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Product Name</th>
                  <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Location</th>
                  <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">User Device</th>
                  <th className="p-4 font-mono uppercase text-slate-400 tracking-wider text-right">Scan Verdict</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, idx) => {
                    const dateStr = new Date(log.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                    return (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-semibold text-slate-400 flex items-center gap-2">
                          <IconClock className="w-4 h-4 text-slate-300" />
                          {dateStr}
                        </td>
                        <td className="p-4 font-mono font-bold text-[#0089C1]">{log.token}</td>
                        <td className="p-4 font-bold text-slate-700">{log.product_name}</td>
                        <td className="p-4 font-bold text-slate-600 flex items-center gap-1">
                          <IconMapPin className="w-3.5 h-3.5 text-slate-400" />
                          {log.ip_country || "Unknown Location"}
                        </td>
                        <td className="p-4 font-semibold text-slate-400 flex items-center gap-1.5">
                          <IconDeviceMobile className="w-3.5 h-3.5 text-slate-400" />
                          {log.device_id || "Unknown Device"}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`px-2.5 py-1 rounded-lg font-mono text-[9px] uppercase font-black ${
                            log.result === "genuine" 
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                              : log.result === "previously_verified" || log.result === "suspicious"
                              ? "bg-yellow-50 text-yellow-600 border border-yellow-100"
                              : "bg-red-50 text-red-600 border border-red-100"
                          }`}>
                            {log.result.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 font-semibold">
                      No scan logs found matching your request.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

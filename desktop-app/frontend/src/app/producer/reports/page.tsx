"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  IconSearch,
  IconMessage,
  IconMapPin,
  IconCheck,
  IconPhone,
  IconFileText
} from "@tabler/icons-react";

export default function ProducerReports() {
  const [reports, setReports] = useState<any[]>([]);

  const fetchReports = async () => {
    try {
      const data = await api.get("/analytics/reports");
      setReports(data || []);
    } catch (err) {
      console.error("Failed to load reports:", err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolveReport = async (id: number) => {
    try {
      await api.post(`/analytics/reports/${id}/resolve`, {});
      await fetchReports();
      alert(`Report R-${id} has been marked as Resolved.`);
    } catch (err: any) {
      alert(err.message || "Failed to resolve report.");
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight text-display">Consumer Fraud Reports</h2>
          <p className="text-slate-500 font-medium mt-1">
            Review alerts filed directly by consumers who encountered suspicious or fake products in the market.
          </p>
        </div>
      </div>

      {/* Reports Table Card */}
      <div className="bg-white border border-slate-200/60 rounded-[32px] overflow-hidden shadow-sm flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search store name or token..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-ahnara-brand focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Report ID</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Serial Token</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Product Name</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Retailer / Store</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Location</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Consumer Phone</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Details</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Status</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const statusLower = r.status?.toLowerCase() || "pending";
                const isRes = statusLower === "resolved";
                const statusLabel = isRes ? "Resolved" : "Open";
                return (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">R-{r.id}</td>
                    <td className="p-4 font-mono font-bold text-red-500">{r.token}</td>
                    <td className="p-4 font-bold text-slate-700">{r.product_name}</td>
                    <td className="p-4 font-bold text-slate-800">{r.retailer_name || "---"}</td>
                    <td className="p-4 font-bold text-slate-600 flex items-center gap-1">
                      <IconMapPin className="w-3.5 h-3.5 text-slate-400" />
                      {r.retailer_location || "---"}
                    </td>
                    <td className="p-4 font-semibold text-slate-500 flex items-center gap-1">
                      <IconPhone className="w-3.5 h-3.5 text-slate-400" />
                      {r.consumer_id ? `Consumer ID: ${r.consumer_id}` : "Anonymous"}
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="text-slate-600 font-medium leading-relaxed truncate" title={r.description}>{r.description || "No description provided."}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                        statusLower === "pending" 
                          ? "bg-red-50 text-red-600 border-red-100 animate-pulse" 
                          : statusLower === "investigating"
                          ? "bg-sky-50 text-[#0089C1] border-sky-100"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {!isRes && (
                        <button
                          onClick={() => handleResolveReport(r.id)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors font-bold text-[10px] uppercase flex items-center gap-1 justify-end ml-auto"
                        >
                          <IconCheck className="w-3.5 h-3.5" />
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

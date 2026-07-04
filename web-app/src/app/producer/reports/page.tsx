"use client";

import React, { useState } from "react";
import {
  IconSearch,
  IconMessage,
  IconMapPin,
  IconCheck,
  IconPhone,
  IconFileText
} from "@tabler/icons-react";

export default function ProducerReports() {
  const [reports, setReports] = useState([
    { id: "R-101", token: "9F3C-71AE", product: "AURA Skincare Serum 50ml", store: "VeeCare Pharmacy", location: "Wuse II, Abuja", phone: "+234 803 291 0422", comment: "The packaging seal looks completely different from the one I bought last month. The serum color is also yellow instead of clear.", date: "July 04, 10:24 AM", status: "Open" },
    { id: "R-102", token: "8C2D-04EE", product: "Hydra Essence", store: "Market Stall 4, Kano Market", location: "Kano City", phone: "+234 809 112 8831", comment: "The QR code was printed on a generic sticker pasted over the packaging box. The merchant insisted it was original.", date: "July 03, 06:12 PM", status: "Open" },
    { id: "R-103", token: "9F3C-71AE", product: "AURA Skincare Serum 50ml", store: "Online IG Vendor", location: "Lagos (Instagram)", phone: "+234 812 400 9021", comment: "Bought it from an Instagram page. Smells like baby oil and the verification page threw a warning.", date: "July 02, 02:40 PM", status: "Investigating" },
    { id: "R-104", token: "3B1C-49DA", product: "AURA Cleanser 100ml", store: "Apex Cosmetic Store", location: "Surulere, Lagos", phone: "+234 701 988 2309", comment: "The serial code didn't match. Spoke with the owner who said they got it from a new wholesale distributor.", date: "June 29, 11:15 AM", status: "Resolved" }
  ]);

  const handleResolveReport = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: "Resolved" } : r));
    alert(`Report ${id} resolved. Scaled counterfeit points updated.`);
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
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0089C1] focus:bg-white"
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
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-800">{r.id}</td>
                  <td className="p-4 font-mono font-bold text-red-500">{r.token}</td>
                  <td className="p-4 font-bold text-slate-700">{r.product}</td>
                  <td className="p-4 font-bold text-slate-800">{r.store}</td>
                  <td className="p-4 font-bold text-slate-600 flex items-center gap-1">
                    <IconMapPin className="w-3.5 h-3.5 text-slate-400" />
                    {r.location}
                  </td>
                  <td className="p-4 font-semibold text-slate-500 flex items-center gap-1">
                    <IconPhone className="w-3.5 h-3.5 text-slate-400" />
                    {r.phone}
                  </td>
                  <td className="p-4 max-w-xs">
                    <p className="text-slate-600 font-medium leading-relaxed truncate">{r.comment}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                      r.status === "Open" 
                        ? "bg-red-50 text-red-600 border-red-100 animate-pulse" 
                        : r.status === "Investigating"
                        ? "bg-sky-50 text-[#0089C1] border-sky-100"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {r.status !== "Resolved" && (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

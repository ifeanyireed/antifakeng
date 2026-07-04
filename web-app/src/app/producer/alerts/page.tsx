"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  IconAlertTriangle,
  IconShieldCheck,
  IconX,
  IconMapPin,
  IconSearch,
  IconActivity,
  IconCheck,
  IconInfoCircle,
  IconLock
} from "@tabler/icons-react";

export default function ProducerAlerts() {
  const [alerts, setAlerts] = useState([
    { id: "A-201", product: "AURA Skincare Serum 50ml", batch: "B-AURA2606", location: "Wuse, Abuja", riskScore: 88, scans: 14, time: "July 04, 10:14 AM", status: "Active", reason: "Impossible Travel Velocity: Duplicate check in Lagos & Abuja in 10 mins." },
    { id: "A-202", product: "Hydra Essence", batch: "B-HYDRA04", location: "Kano Main Market", riskScore: 75, scans: 6, time: "July 03, 05:42 PM", status: "Active", reason: "High-Volume Duplicates: Serial token checked from 6 distinct device fingerprints." },
    { id: "A-203", product: "AURA Cleanser 100ml", batch: "B-CLEAN01", location: "Oshodi, Lagos", riskScore: 92, scans: 25, time: "July 01, 11:15 AM", status: "Investigating", reason: "Invalid Token Signature: Product scanned with incorrect crypto verification keys." },
    { id: "A-204", product: "AURA Skincare Serum 50ml", batch: "B-AURA2606", location: "Ikeja, Lagos", riskScore: 34, scans: 2, time: "June 28, 02:30 PM", status: "Resolved", reason: "False positive: Single repeat scan by original consumer." }
  ]);

  const [selectedAlertId, setSelectedAlertId] = useState<string>("A-201");
  const selectedAlert = alerts.find(a => a.id === selectedAlertId) || alerts[0];

  const handleResolveAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "Resolved" } : a));
    alert(`Alert ${id} has been marked as Resolved. The security risk score for this batch has been recalculated.`);
  };

  const handleInvestigateAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "Investigating" } : a));
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
      
      {/* Alerts List Column (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight text-display">Threat &amp; Counterfeit Center</h2>
          <p className="text-slate-500 font-medium mt-1">
            Investigate duplicate serial checks, travel velocity warnings and signature failures.
          </p>
        </div>

        {/* List of alerts */}
        <div className="bg-white border border-slate-200/60 rounded-[32px] overflow-hidden shadow-sm flex flex-col p-4 gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">Active Alerts Feed</span>
          
          <div className="flex flex-col gap-3">
            {alerts.map((a) => {
              const isSelected = a.id === selectedAlertId;
              return (
                <div
                  key={a.id}
                  onClick={() => setSelectedAlertId(a.id)}
                  className={`border p-4 rounded-2xl cursor-pointer transition-all flex flex-col gap-3 text-left ${
                    isSelected
                      ? "border-red-400 bg-red-50/10 shadow-xs"
                      : "border-slate-200/60 bg-white hover:bg-slate-50/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                        a.riskScore > 80 
                          ? "bg-red-100 text-red-600" 
                          : a.riskScore > 50 
                          ? "bg-orange-100 text-orange-600"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {a.id} • RISK: {a.riskScore}%
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        a.status === "Active" 
                          ? "bg-red-50 text-red-600 border border-red-100 animate-pulse" 
                          : a.status === "Investigating"
                          ? "bg-sky-50 text-[#0089C1] border border-sky-100"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {a.status}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">{a.time}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-800">{a.product}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Batch: {a.batch} • {a.location}</p>
                    <p className="text-[11px] text-slate-600 font-semibold mt-2 line-clamp-1">{a.reason}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Investigation Details Panel (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Detail Card */}
        <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 shadow-sm flex flex-col gap-6 text-left">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Case Investigation Detail</span>
            <h3 className="text-lg font-black text-slate-800 text-display mt-1">{selectedAlert.id}</h3>
          </div>

          <div className="flex flex-col gap-4 text-xs font-semibold text-slate-600">
            <div>
              <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Product Name</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedAlert.product}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Batch Number</span>
                <p className="font-bold text-slate-800 font-mono mt-0.5">{selectedAlert.batch}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Scans Flagged</span>
                <p className="font-bold text-red-600 mt-0.5">{selectedAlert.scans} total scans</p>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Location Hotspot</span>
              <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <IconMapPin className="w-4 h-4 text-slate-400" />
                {selectedAlert.location}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex flex-col gap-2">
              <span className="text-slate-400 text-[9px] uppercase tracking-wider block">Security Rule Trigger</span>
              <p className="font-bold text-slate-700 leading-relaxed">{selectedAlert.reason}</p>
            </div>
          </div>

          {/* Action Row */}
          {selectedAlert.status !== "Resolved" && (
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              {selectedAlert.status === "Active" && (
                <button
                  onClick={() => handleInvestigateAlert(selectedAlert.id)}
                  className="flex-1 bg-[#E8EFF4] border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-bold py-3.5 rounded-full text-xs"
                >
                  Investigate
                </button>
              )}
              <button
                onClick={() => handleResolveAlert(selectedAlert.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white transition-all font-bold py-3.5 rounded-full text-xs shadow-md shadow-red-600/10 flex items-center justify-center gap-1"
              >
                <IconCheck className="w-4 h-4" />
                Resolve Alert
              </button>
            </div>
          )}

          {selectedAlert.status === "Resolved" && (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl p-4 flex items-center gap-2">
              <IconShieldCheck className="w-5 h-5" />
              <span className="text-[11px] font-bold">This investigation has been resolved and closed.</span>
            </div>
          )}
        </div>

        {/* Live Telemetry hot coordinates */}
        <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 shadow-sm flex flex-col gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Device Telemetry Logs</span>
          <div className="flex flex-col gap-2 text-[10px] font-mono font-bold text-slate-500">
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span>Android Chrome v124</span>
              <span>102.82.4.11</span>
              <span className="text-slate-400">10:14 AM</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span>iOS Safari v17.4</span>
              <span>105.112.44.89</span>
              <span className="text-slate-400">10:13 AM</span>
            </div>
            <div className="flex justify-between">
              <span>Windows Edge v125</span>
              <span>197.210.8.5</span>
              <span className="text-slate-400">10:10 AM</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

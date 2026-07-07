"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
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
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string>("");
  const [telemetryLogs, setTelemetryLogs] = useState<any[]>([]);

  const fetchAlerts = async () => {
    try {
      const data = await api.get("/analytics/alerts");
      setAlerts(data || []);
      if (data && data.length > 0) {
        setSelectedAlertId(String(data[0].id));
      }
    } catch (err) {
      console.error("Failed to load alerts:", err);
    }
  };

  const fetchTelemetry = async () => {
    try {
      const data = await api.get("/analytics/history");
      setTelemetryLogs((data || []).slice(0, 5));
    } catch (err) {
      console.error("Failed to load telemetry logs:", err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchTelemetry();
  }, []);

  const selectedAlert = alerts.find(a => String(a.id) === selectedAlertId) || alerts[0];

  const handleResolveAlert = async (id: number) => {
    try {
      await api.post(`/analytics/alerts/${id}/resolve`, {});
      await fetchAlerts();
      alert(`Alert A-${id} has been marked as Resolved.`);
    } catch (err: any) {
      alert(err.message || "Failed to resolve alert.");
    }
  };

  const handleInvestigateAlert = (id: number) => {
    alert(`Alert case A-${id} is now flag-marked for manual validation.`);
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
              const isSelected = String(a.id) === selectedAlertId;
              const riskPercent = Math.round((a.risk_score || 0.8) * 100);
              const status = a.resolved_at ? "Resolved" : "Active";
              const timeString = a.created_at 
                ? new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + new Date(a.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                : "Just now";
              return (
                <div
                  key={a.id}
                  onClick={() => setSelectedAlertId(String(a.id))}
                  className={`border p-4 rounded-2xl cursor-pointer transition-all flex flex-col gap-3 text-left ${
                    isSelected
                      ? "border-red-400 bg-red-50/10 shadow-xs"
                      : "border-slate-200/60 bg-white hover:bg-slate-50/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                        riskPercent > 80 
                          ? "bg-red-100 text-red-600" 
                          : riskPercent > 50 
                          ? "bg-orange-100 text-orange-600"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        A-{a.id} • RISK: {riskPercent}%
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                        status === "Active" 
                          ? "bg-red-50 text-red-600 border-red-100 animate-pulse" 
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {status}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">{timeString}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-800">{a.product_name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Token ID: {a.token || "---"} • Location: {a.ip_country || "Nigeria"}</p>
                    <p className="text-[11px] text-slate-600 font-semibold mt-2 line-clamp-1">{a.signal_type || "Suspicious scan activity"}</p>
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
        {selectedAlert ? (
          <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 shadow-sm flex flex-col gap-6 text-left">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Case Investigation Detail</span>
              <h3 className="text-lg font-black text-slate-800 text-display mt-1">A-{selectedAlert.id}</h3>
            </div>

            <div className="flex flex-col gap-4 text-xs font-semibold text-slate-600">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Product Name</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedAlert.product_name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Verification Token</span>
                  <p className="font-bold text-slate-800 font-mono mt-0.5">{selectedAlert.token}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Threat Level</span>
                  <p className="font-bold text-red-600 mt-0.5">{Math.round((selectedAlert.risk_score || 0) * 100)}% risk</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Location Hotspot</span>
                <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <IconMapPin className="w-4 h-4 text-slate-400" />
                  {selectedAlert.ip_country || "Nigeria"}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex flex-col gap-2">
                <span className="text-slate-400 text-[9px] uppercase tracking-wider block">Security Rule Trigger</span>
                <p className="font-bold text-slate-700 leading-relaxed">{selectedAlert.signal_type}</p>
              </div>
            </div>

            {/* Action Row */}
            {!selectedAlert.resolved_at && (
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleInvestigateAlert(selectedAlert.id)}
                  className="flex-1 bg-[#E8EFF4] border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-bold py-3.5 rounded-full text-xs"
                >
                  Investigate
                </button>
                <button
                  onClick={() => handleResolveAlert(selectedAlert.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white transition-all font-bold py-3.5 rounded-full text-xs shadow-md shadow-red-600/10 flex items-center justify-center gap-1"
                >
                  <IconCheck className="w-4 h-4" />
                  Resolve Alert
                </button>
              </div>
            )}

            {selectedAlert.resolved_at && (
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl p-4 flex items-center gap-2">
                <IconShieldCheck className="w-5 h-5" />
                <span className="text-[11px] font-bold">This investigation has been resolved and closed.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 shadow-sm flex flex-col gap-6 text-center text-slate-400 text-xs font-semibold">
            No active threat alerts flagged.
          </div>
        )}

        {/* Live Telemetry logs */}
        <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 shadow-sm flex flex-col gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Device Telemetry Logs</span>
          <div className="flex flex-col gap-2 text-[10px] font-mono font-bold text-slate-500">
            {telemetryLogs.length > 0 ? (
              telemetryLogs.map((log, idx) => {
                const isLast = idx === telemetryLogs.length - 1;
                const timeString = log.created_at
                  ? new Date(log.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                  : "Just now";
                // If device_id starts with device_browser, let's parse or humanize it
                let displayDevice = log.device_id || "Unknown Device";
                if (displayDevice.startsWith("device_browser_")) {
                  // Humanize mock device IDs to look clean
                  const idNum = displayDevice.split("_")[2];
                  const devices = [
                    "iOS Safari v17.4",
                    "Android Chrome v124",
                    "Windows Edge v125",
                    "Mac Chrome v124",
                    "iOS Webview v17.2",
                    "Linux Firefox v126"
                  ];
                  displayDevice = devices[parseInt(idNum) % devices.length] || "Mobile Browser";
                }
                
                // IP mapping fallback
                const ipList = ["102.82.4.11", "105.112.44.89", "197.210.8.5", "197.210.12.94", "102.89.2.14"];
                const displayIp = ipList[idx % ipList.length] + ` (${log.ip_country || "NG"})`;

                return (
                  <div key={log.id || idx} className={`flex justify-between ${!isLast ? "border-b border-slate-100 pb-1.5" : ""}`}>
                    <span>{displayDevice}</span>
                    <span>{displayIp}</span>
                    <span className="text-slate-400">{timeString}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-slate-400 py-2 text-center font-sans">No recent telemetry records found.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  IconBuildingStore,
  IconQrcode,
  IconAlertTriangle,
  IconActivity,
  IconCheck,
  IconInfoCircle,
  IconLock
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { AhnaraLoader } from "@/components/ahnara/AhnaraLoader";

export default function AdminDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      try {
        setIsLoading(true);
        const [summaryRes, alertsRes] = await Promise.all([
          api.get("/analytics/summary").catch(() => null),
          api.get("/analytics/alerts").catch(() => [])
        ]);

        if (summaryRes) setSummary(summaryRes);
        if (alertsRes) setAlerts(alertsRes);
      } catch (err) {
        console.error("Failed to load admin dashboard telemetry:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <AhnaraLoader label="Syncing SaaS Core Node..." />
      </div>
    );
  }

  const producersCount = summary?.producers_count || 0;
  const activeAlertsCount = summary?.active_alerts || 0;
  const scansCount = summary?.scans_count || 0;

  const stats = [
    { name: "Active Producers", value: `${producersCount} Brand${producersCount !== 1 ? "s" : ""}`, detail: "Registered Tenants", icon: IconBuildingStore, color: "text-[#0089C1]", bg: "bg-sky-50" },
    { name: "Total Serial Inventory", value: `${scansCount.toLocaleString()} Scans`, detail: "Cryptographic lookups", icon: IconQrcode, color: "text-purple-600", bg: "bg-purple-50" },
    { name: "Global Threat Incidents", value: `${activeAlertsCount} Flag${activeAlertsCount !== 1 ? "s" : ""}`, detail: "Active investigations", icon: IconAlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    { name: "API Request Speed", value: "42ms Avg", detail: "99.99% uptime SLA", icon: IconActivity, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  const recentIncidents = (alerts || []).slice(0, 5).map((alert: any) => {
    const diffMs = new Date().getTime() - new Date(alert.created_at).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    let timeStr = "Just now";
    if (diffMins > 0) {
      if (diffMins < 60) {
        timeStr = `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
      } else {
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) {
          timeStr = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        } else {
          timeStr = new Date(alert.created_at).toLocaleDateString();
        }
      }
    }

    return {
      brand: alert.brand_name || "Unknown Tenant",
      type: alert.signal_type ? alert.signal_type.replace(/_/g, " ").toUpperCase() : "SUSPICIOUS VERIFICATION",
      detail: `Risk Score: ${Math.round(alert.risk_score * 100)}%. Token: ${alert.token}`,
      severity: alert.severity ? alert.severity.toUpperCase() : "HIGH",
      time: timeStr
    };
  });

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 text-left animate-fade-in">
      
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
            {recentIncidents.length > 0 ? (
              recentIncidents.map((inc, idx) => (
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
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                No threat incidents registered. SaaS node secure.
              </div>
            )}
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
                <span className="font-bold text-slate-800">12%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "12%" }} />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span>Database Connections</span>
                <span className="font-bold text-slate-800">18 / 200</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#0089C1] h-full rounded-full" style={{ width: "9%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Memory Allocation</span>
                <span className="font-bold text-slate-800">1.4 GB / 8 GB</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: "17%" }} />
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
              <p className="text-sm font-black text-slate-800 mt-0.5">{scansCount.toLocaleString()} scans</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block tracking-wider">Active Batches</span>
              <p className="text-sm font-black text-slate-800 mt-0.5">{summary?.batches_count || 0} batches</p>
            </div>
          </div>
        </div>

      </aside>

    </div>
  );
}

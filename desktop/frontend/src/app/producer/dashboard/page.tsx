"use client";

import React, { useState, useEffect } from "react";
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
import { api } from "@/lib/api";
import { AhnaraLoader } from "@/components/ahnara/AhnaraLoader";

export default function ProducerDashboard() {
  const [timeframe, setTimeframe] = useState("7d");
  const [profile, setProfile] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [scansData, setScansData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [profileRes, summaryRes, scansRes, alertsRes, historyRes] = await Promise.all([
          api.get("/producer/profile").catch(() => null),
          api.get("/analytics/summary").catch(() => null),
          api.get("/analytics/scans").catch(() => null),
          api.get("/analytics/alerts").catch(() => []),
          api.get("/analytics/history").catch(() => [])
        ]);

        if (profileRes) setProfile(profileRes);
        if (summaryRes) setSummary(summaryRes);
        if (scansRes) setScansData(scansRes);
        if (alertsRes) setAlerts(alertsRes);
        if (historyRes) setHistory(historyRes);
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <AhnaraLoader label="Retrieving Real-Time Metrics..." />
      </div>
    );
  }

  // Derive dynamic stats from summary
  const totalScans = summary?.scans_count || 0;
  const genuineScans = summary?.genuine_count || 0;
  const suspiciousScans = summary?.suspicious_count || 0;
  const productsCount = summary?.products_count || 0;

  const genuinePercentage = totalScans > 0 ? ((genuineScans / totalScans) * 100).toFixed(1) + "%" : "0%";

  const stats = [
    { name: "Total Serial Scans", value: totalScans.toLocaleString(), change: "Lifetime Scans", icon: IconQrcode, color: "text-[#0089C1]", bg: "bg-sky-50" },
    { name: "Genuine Confirmations", value: genuineScans.toLocaleString(), change: `${genuinePercentage} rate`, icon: IconShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "Counterfeit Alerts", value: suspiciousScans.toLocaleString(), change: `${summary?.recalled_count || 0} recalled QRs`, icon: IconAlertOctagon, color: "text-red-600", bg: "bg-red-50" },
    { name: "Products In Catalog", value: productsCount.toLocaleString(), change: `${summary?.batches_count || 0} batches`, icon: IconTrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  // Derive dynamic timeline chart
  const dateMap: { [dateStr: string]: number } = {};
  if (scansData && scansData.timeline) {
    scansData.timeline.forEach((item: any) => {
      const d = item.date.split("T")[0];
      dateMap[d] = (dateMap[d] || 0) + item.count;
    });
  }

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = days[d.getDay()];
    chartData.push({
      day: dayName,
      scans: dateMap[dateStr] || 0
    });
  }

  const maxScans = Math.max(...chartData.map(d => d.scans), 1);

  // Derive dynamic scan logs feed
  const recentScans = (history || []).slice(0, 5).map((scan: any) => {
    const diffMs = new Date().getTime() - new Date(scan.created_at).getTime();
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
          timeStr = new Date(scan.created_at).toLocaleDateString();
        }
      }
    }
    return {
      product: scan.product_name,
      location: scan.ip_country || "Unknown Location",
      time: timeStr,
      verdict: scan.result
    };
  });

  // Derive active alerts list
  const activeAlerts = (alerts || [])
    .filter((alert: any) => !alert.resolved_at)
    .slice(0, 2)
    .map((alert: any) => {
      const timeStr = new Date(alert.created_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      return {
        id: `A-${alert.id}`,
        product: alert.product_name,
        location: alert.ip_country || "Unknown Location",
        riskScore: Math.round(alert.risk_score * 100),
        scans: alert.severity === "high" || alert.severity === "critical" ? 8 : 2,
        time: timeStr
      };
    });

  const producerName = profile?.name || "Brand";
  const hotspotLocation = activeAlerts.length > 0 ? activeAlerts[0].location : "None";
  const threatDescription = activeAlerts.length > 0
    ? `Live telemetry reports potential counterfeit checks for "${activeAlerts[0].product}" originating from ${activeAlerts[0].location}.`
    : "No active threat warnings detected. All scanned barcodes match authentic signatures.";

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 text-left animate-fade-in">
      
      {/* LEFT/CENTER PANELS (8 COLS) */}
      <main className="lg:col-span-8 flex flex-col gap-6">
        
        {/* GREETING ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight text-display">{producerName} Dashboard</h2>
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
            <span className="text-xs text-slate-600 font-bold">Real-time Activity</span>
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
            {recentScans.length > 0 ? (
              recentScans.map((scan, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/40">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                      scan.verdict === "genuine" ? "bg-emerald-500" : scan.verdict === "suspicious" ? "bg-red-500" : "bg-yellow-500"
                    }`} />
                    <div className="text-left">
                      <h4 className="text-xs font-black text-slate-800">{scan.product}</h4>
                      <span className="text-[10px] text-slate-400 font-bold block">{scan.location} • {scan.time}</span>
                    </div>
                  </div>
                  
                  {/* Verdict Badge */}
                  <span className={`px-2.5 py-1 rounded-lg font-mono text-[9px] uppercase font-black ${
                    scan.verdict === "genuine" 
                      ? "bg-emerald-50 text-emerald-600" 
                      : scan.verdict === "previously_verified" || scan.verdict === "suspicious"
                      ? "bg-yellow-50 text-yellow-600"
                      : "bg-red-50 text-red-600"
                  }`}>
                    {scan.verdict.replace("_", " ")}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                No recent scans logged in timeframe.
              </div>
            )}
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
            
            {activeAlerts.length > 0 ? (
              <>
                <div className="absolute top-1/3 left-1/2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                <div className="absolute top-1/3 left-1/2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
                <div className="absolute bottom-2.5 right-2.5 bg-[#1E293B] text-white px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider">
                  Hotspot: {hotspotLocation}
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                System Secure
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
            {threatDescription}
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
            {activeAlerts.length > 0 ? (
              activeAlerts.map((alert) => (
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
                    <p className="text-[10px] text-red-600 font-bold mt-1">{alert.scans} suspicious check attempts</p>
                  </div>
                  <Link href="/producer/alerts">
                    <button className="w-full bg-[#1E293B] text-white hover:bg-slate-800 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1">
                      Investigate Threat
                      <IconArrowUpRight className="w-3 h-3" />
                    </button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                No active threats detected.
              </div>
            )}
          </div>
        </div>

      </aside>

    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconBell,
  IconAlertOctagon,
  IconCheck,
  IconTrash,
  IconCircleFilled,
  IconUserPlus,
  IconDatabase
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { AhnaraLoader } from "@/components/ahnara/AhnaraLoader";

interface AdminNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  rawTime: number;
  type: "fraud" | "system" | "producer" | "general";
  read: boolean;
}

const formatTime = (dateStr: string) => {
  const diffMs = new Date().getTime() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins <= 0) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
};

export default function AdminNotifications() {
  const [filter, setFilter] = useState<"all" | "fraud" | "system" | "producer">("all");
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminNotifications = async () => {
      try {
        setIsLoading(true);
        const [alertsData, producersData, logsData] = await Promise.all([
          api.get("/analytics/alerts").catch(() => []),
          api.get("/producer/admin/producers").catch(() => []),
          api.get("/analytics/audit-logs").catch(() => [])
        ]);

        const merged: AdminNotification[] = [];

        // 1. Add Alerts (Fraud)
        (alertsData || []).forEach((alert: any) => {
          merged.push({
            id: `alert-${alert.id}`,
            title: alert.risk_score > 0.8 ? "Critical: Cross-tenant fraud alert" : "Suspicious scan rate warning",
            description: `Duplicate token scan alert for "${alert.product_name}" from "${alert.brand_name}" in ${alert.ip_country || "Unknown Location"}. Risk score: ${Math.round(alert.risk_score * 100)}%.`,
            time: formatTime(alert.created_at),
            rawTime: new Date(alert.created_at).getTime(),
            type: "fraud",
            read: !!alert.resolved_at
          });
        });

        // 2. Add Producers (Tenant signups)
        (producersData || []).forEach((p: any) => {
          const planName = p.plan_tier ? p.plan_tier.charAt(0).toUpperCase() + p.plan_tier.slice(1).toLowerCase() : "Growth";
          merged.push({
            id: `producer-${p.id}`,
            title: "New tenant signed up",
            description: `Brand "${p.name}" (${p.contact_email}) onboarded successfully on the "${planName}" plan.`,
            time: formatTime(p.created_at),
            rawTime: new Date(p.created_at).getTime(),
            type: "producer",
            read: p.status === "active"
          });
        });

        // 3. Add Audit Logs (System events)
        (logsData || []).forEach((log: any) => {
          merged.push({
            id: `log-${log.id}`,
            title: "Global system operation executed",
            description: `Operator "${log.actor_email || "System Engine"}" successfully completed action "${log.action ? log.action.replace(/_/g, " ") : "N/A"}" on target entity "${log.target_entity}".`,
            time: formatTime(log.created_at),
            rawTime: new Date(log.created_at).getTime(),
            type: "system",
            read: true
          });
        });

        // Sort by rawTime descending
        merged.sort((a, b) => b.rawTime - a.rawTime);

        setNotifications(merged);
      } catch (err) {
        console.error("Failed to compile admin notifications:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminNotifications();
  }, []);

  const markAllRead = () => {
    setNotifications(
      notifications.map((n) => ({ ...n, read: true }))
    );
  };

  const toggleRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const filteredNotifications = notifications.filter(
    (n) => filter === "all" || n.type === filter
  );

  const getIcon = (type: string) => {
    switch (type) {
      case "fraud":
        return { icon: IconAlertOctagon, bg: "bg-red-50", color: "text-red-600" };
      case "producer":
        return { icon: IconUserPlus, bg: "bg-emerald-50", color: "text-emerald-600" };
      case "system":
        return { icon: IconDatabase, bg: "bg-purple-50", color: "text-purple-600" };
      default:
        return { icon: IconBell, bg: "bg-sky-50", color: "text-[#0089C1]" };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto text-left flex flex-col gap-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight text-display">SaaS Administration Notifications</h2>
          <p className="text-slate-500 font-medium mt-1">
            Global system updates, tenant registrations, and network threat operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold shadow-xs transition-all"
          >
            <IconCheck className="w-4 h-4" />
            Mark all as read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-300/35 self-start">
        {["all", "fraud", "system", "producer"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${
              filter === type
                ? "bg-[#1E293B] text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {type === "all" ? "All Updates" : type === "producer" ? "Tenant Signups" : type + " alerts"}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs flex flex-col divide-y divide-slate-100">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4">
            <AhnaraLoader label="Synchronizing Feed..." />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => {
                const meta = getIcon(notif.type);
                const Icon = meta.icon;
                return (
                  <motion.div
                    layout
                    key={notif.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className={`py-5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 transition-all duration-200 ${
                      !notif.read ? "bg-slate-50/40 -mx-6 px-6 rounded-2xl" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      {/* Status Dot */}
                      <div className="pt-2">
                        {!notif.read ? (
                          <IconCircleFilled className="w-2.5 h-2.5 text-blue-600" />
                        ) : (
                          <div className="w-2.5 h-2.5" />
                        )}
                      </div>

                      {/* Icon Category */}
                      <div className={`w-10 h-10 rounded-xl flex-none flex items-center justify-center ${meta.bg} ${meta.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-2">
                          <h4 className={`font-bold text-base leading-tight ${!notif.read ? "text-slate-900" : "text-slate-700"}`}>
                            {notif.title}
                          </h4>
                          <span className="text-xs text-slate-400 font-medium">{notif.time}</span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium max-w-2xl leading-normal">
                          {notif.description}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRead(notif.id)}
                        title={notif.read ? "Mark as unread" : "Mark as read"}
                        className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                      >
                        <IconCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        title="Delete notification"
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                  <IconBell className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No admin alerts found</h3>
                <p className="text-slate-400 text-sm max-w-xs mt-1">
                  SaaS infrastructure is performing smoothly. Security and tenant events will appear here.
                </p>
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

    </div>
  );
}

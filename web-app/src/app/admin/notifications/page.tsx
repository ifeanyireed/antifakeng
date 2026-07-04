"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconBell,
  IconAlertOctagon,
  IconFileText,
  IconCheck,
  IconTrash,
  IconCircleFilled,
  IconShieldCheck,
  IconUserPlus,
  IconDatabase
} from "@tabler/icons-react";

interface AdminNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "fraud" | "system" | "producer" | "general";
  read: boolean;
}

export default function AdminNotifications() {
  const [filter, setFilter] = useState<"all" | "fraud" | "system" | "producer">("all");
  const [notifications, setNotifications] = useState<AdminNotification[]>([
    {
      id: "1",
      title: "Critical: Cross-tenant fraud alert",
      description: "IP origin from Russia checked 12 separate batch tokens across 'AURA Skincare' and 'Nexa Agro' within 10 minutes.",
      time: "5 mins ago",
      type: "fraud",
      read: false
    },
    {
      id: "2",
      title: "New tenant signed up",
      description: "Brand 'Nexa Agro' successfully onboarded on the Starter plan.",
      time: "2 hours ago",
      type: "producer",
      read: false
    },
    {
      id: "3",
      title: "Hostinger DB replication sync completed",
      description: "Remote MySQL replication completed with zero discrepancies across all 11 tables.",
      time: "5 hours ago",
      type: "system",
      read: true
    },
    {
      id: "4",
      title: "Suspicious scan rate threshold exceeded",
      description: "Token scan rate in Surulere, Lagos exceeds the normal consumer baseline by 300%.",
      time: "1 day ago",
      type: "fraud",
      read: true
    },
    {
      id: "5",
      title: "Global audit trail exported",
      description: "Admin 'Super Admin' successfully exported the complete CSV audit trail.",
      time: "2 days ago",
      type: "system",
      read: true
    }
  ]);

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
    <div className="w-full max-w-4xl mx-auto text-left flex flex-col gap-6">
      
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
      </div>

    </div>
  );
}

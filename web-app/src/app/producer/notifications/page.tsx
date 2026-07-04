"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconBell,
  IconAlertOctagon,
  IconFileText,
  IconCheck,
  IconTrash,
  IconSettings,
  IconCircleFilled,
  IconShieldCheck
} from "@tabler/icons-react";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "alert" | "report" | "system" | "success";
  read: boolean;
}

export default function ProducerNotifications() {
  const [filter, setFilter] = useState<"all" | "alert" | "report" | "system">("all");
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Suspicious scan activity detected",
      description: "Batch B-AUR-2026-01 experienced 14 duplicate scans within 5 minutes in Wuse, Abuja.",
      time: "2 mins ago",
      type: "alert",
      read: false
    },
    {
      id: "2",
      title: "New consumer report submitted",
      description: "A consumer reported seeing suspect 'AURA Skincare Serum' packages at a retailer in Ikeja Mall.",
      time: "1 hour ago",
      type: "report",
      read: false
    },
    {
      id: "3",
      title: "Weekly verification report is ready",
      description: "Your weekly verification volume digest has been generated. Total scans: 5,420.",
      time: "1 day ago",
      type: "system",
      read: true
    },
    {
      id: "4",
      title: "New batch activated successfully",
      description: "QA officer approved and activated production batch B-AUR-2026-01 (5,000 tags).",
      time: "2 days ago",
      type: "success",
      read: true
    },
    {
      id: "5",
      title: "Account plan limit reached soon",
      description: "You have used 84% of your monthly QR code limit. Upgrade to Enterprise to unlock unlimited generations.",
      time: "3 days ago",
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
      case "alert":
        return { icon: IconAlertOctagon, bg: "bg-red-50", color: "text-red-600" };
      case "report":
        return { icon: IconFileText, bg: "bg-amber-50", color: "text-amber-600" };
      case "success":
        return { icon: IconShieldCheck, bg: "bg-emerald-50", color: "text-emerald-600" };
      default:
        return { icon: IconBell, bg: "bg-sky-50", color: "text-[#0089C1]" };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto text-left flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight text-display">Notifications</h2>
          <p className="text-slate-500 font-medium mt-1">
            Stay updated with real-time system alerts, consumer reports, and batch statuses.
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
        {["all", "alert", "report", "system"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${
              filter === type
                ? "bg-[#1E293B] text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {type === "all" ? "All Updates" : type + "s"}
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
              <h3 className="text-lg font-bold text-slate-800">No notifications found</h3>
              <p className="text-slate-400 text-sm max-w-xs mt-1">
                You are all caught up! Updates related to verification alerts or reports will appear here.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

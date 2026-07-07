"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconMail,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconBuildingStore,
  IconInfoCircle,
  IconUser,
  IconChevronRight,
  IconSearch
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { AhnaraLoader } from "@/components/ahnara/AhnaraLoader";

interface Submission {
  id: number;
  form_type: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  token: string;
  store_name: string;
  message: string;
  status: string;
  created_at: string;
}

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "demo" | "support" | "fake">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      setErrorMsg("");
      const data = await api.get("/auth/admin/support-submissions");
      setSubmissions(data || []);
      if (data && data.length > 0 && !selectedSubId) {
        setSelectedSubId(data[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load inbound requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      await api.post(`/auth/admin/support-submissions?id=${id}&status=${newStatus}`, {});
      setSuccessMsg(`Ticket status updated to ${newStatus}!`);
      
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
      
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update submission status.");
    }
  };

  // Filter and categorize submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const isDemo = sub.form_type === "contact" && sub.subject === "Demo Request from Homepage";
      const isSupport = sub.form_type === "contact" && sub.subject !== "Demo Request from Homepage";
      const isFake = sub.form_type === "report";

      if (activeTab === "demo" && !isDemo) return false;
      if (activeTab === "support" && !isSupport) return false;
      if (activeTab === "fake" && !isFake) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          sub.name.toLowerCase().includes(query) ||
          sub.email.toLowerCase().includes(query) ||
          sub.subject.toLowerCase().includes(query) ||
          sub.message.toLowerCase().includes(query) ||
          sub.store_name.toLowerCase().includes(query) ||
          sub.token.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [submissions, activeTab, searchQuery]);

  const selectedSub = submissions.find((s) => s.id === selectedSubId) || filteredSubmissions[0];

  const counts = useMemo(() => {
    let pendingDemos = 0;
    let pendingSupport = 0;
    let pendingFakes = 0;

    submissions.forEach((sub) => {
      if (sub.status === "pending") {
        const isDemo = sub.form_type === "contact" && sub.subject === "Demo Request from Homepage";
        const isSupport = sub.form_type === "contact" && sub.subject !== "Demo Request from Homepage";
        const isFake = sub.form_type === "report";

        if (isDemo) pendingDemos++;
        else if (isSupport) pendingSupport++;
        else if (isFake) pendingFakes++;
      }
    });

    return {
      demos: pendingDemos,
      support: pendingSupport,
      fakes: pendingFakes,
      totalPending: pendingDemos + pendingSupport + pendingFakes
    };
  }, [submissions]);

  return (
    <div className="w-full flex-1 flex flex-col gap-6 text-left font-sans">
      
      {/* Header and Counters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight text-display">Inbound Request Hub</h2>
          <p className="text-slate-500 font-medium mt-1">
            Manage demo requests, support tickets, and counterfeit report submissions.
          </p>
        </div>
        
        {/* Status Pills */}
        <div className="flex items-center gap-3">
          <div className="bg-[#DDEEF3] border border-slate-200/50 rounded-2xl px-4 py-2.5 flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unresolved Tickets</span>
              <span className="text-lg font-black text-slate-800">{counts.totalPending}</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Notifications banner */}
      {(successMsg || errorMsg) && (
        <div className="w-full">
          {successMsg && (
            <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-xs font-bold">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-2xl text-xs font-bold">
              {errorMsg}
            </div>
          )}
        </div>
      )}

      {/* Navigation Sub-Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-[#DDEEF3] p-1 rounded-2xl border border-slate-300/30 w-full md:w-auto">
          {(["all", "demo", "support", "fake"] as const).map((tab) => {
            const labelMap = {
              all: "All Submissions",
              demo: `Demo Requests (${counts.demos})`,
              support: `Support Tickets (${counts.support})`,
              fake: `Reported Fakes (${counts.fakes})`
            };
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedSubId(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab 
                    ? "bg-[#1E293B] text-white shadow-xs" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/10"
                }`}
              >
                {labelMap[tab]}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-2 flex items-center w-full md:w-80 shadow-xs">
          <IconSearch className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
          <input 
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs text-slate-800 placeholder-slate-400 font-semibold"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <AhnaraLoader />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* List Section (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200/60 rounded-[32px] p-4 flex flex-col gap-3 shadow-sm min-h-[450px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">Submissions Feed</span>
            
            <div className="flex flex-col gap-2.5 max-h-[550px] overflow-y-auto pr-1">
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((sub) => {
                  const isSelected = sub.id === selectedSubId;
                  const isDemo = sub.form_type === "contact" && sub.subject === "Demo Request from Homepage";
                  const isFake = sub.form_type === "report";
                  
                  const typeLabel = isDemo 
                    ? "Demo Request" 
                    : isFake 
                    ? "Fake Product Report" 
                    : "Support Ticket";
                    
                  const dateStr = sub.created_at
                    ? new Date(sub.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "Just now";

                  return (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSubId(sub.id)}
                      className={`border p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-4 ${
                        isSelected 
                          ? "border-[#1E293B] bg-slate-50 ring-1 ring-slate-800/10 shadow-xs" 
                          : "border-slate-100 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                            isFake 
                              ? "bg-red-50 text-red-600 border-red-100" 
                              : isDemo 
                              ? "bg-emerald-50 text-[#245C44] border-emerald-100"
                              : "bg-sky-50 text-[#0089C1] border-sky-100"
                          }`}>
                            {typeLabel}
                          </span>
                          
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                            sub.status === "resolved"
                              ? "bg-emerald-100/60 text-emerald-800"
                              : "bg-orange-100/60 text-orange-800"
                          }`}>
                            {sub.status}
                          </span>
                        </div>
                        
                        <h4 className="font-extrabold text-slate-800 text-sm truncate">
                          {isFake ? `Counterfeit Alert: Token ${sub.token}` : sub.subject || "No Subject"}
                        </h4>
                        
                        <p className="text-[10px] text-slate-400 font-bold truncate">
                          {sub.name} • {sub.email || sub.phone}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-bold text-slate-400">{dateStr}</span>
                        <IconChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-slate-400 py-16 text-xs font-semibold">
                  No submissions match the current tab or query.
                </div>
              )}
            </div>
          </div>

          {/* Details Section (5 Cols) */}
          <div className="lg:col-span-5">
            {selectedSub ? (
              <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 flex flex-col gap-6 shadow-sm text-left">
                
                {/* Header */}
                <div className="flex flex-col gap-2 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ticket Details</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      selectedSub.status === "resolved"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-orange-100 text-orange-800 animate-pulse"
                    }`}>
                      {selectedSub.status}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800 leading-snug">
                    {selectedSub.form_type === "report" 
                      ? `Suspicious Product Token ${selectedSub.token}` 
                      : selectedSub.subject}
                  </h3>
                </div>

                {/* Sender Details */}
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <IconUser className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Sender Info</span>
                      <span className="text-xs font-black text-slate-800 truncate">{selectedSub.name || "Anonymous Consumer"}</span>
                      <span className="text-[10px] text-slate-400 font-bold truncate">{selectedSub.email || "No email"}</span>
                    </div>
                  </div>

                  {selectedSub.phone && (
                    <div className="flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <IconMail className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Phone Number</span>
                        <span className="text-xs font-black text-slate-800">{selectedSub.phone}</span>
                      </div>
                    </div>
                  )}

                  {selectedSub.store_name && (
                    <div className="flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <IconBuildingStore className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          {selectedSub.form_type === "report" ? "Purchased From" : "Company / Organization"}
                        </span>
                        <span className="text-xs font-black text-slate-800">{selectedSub.store_name}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Body */}
                <div className="flex flex-col gap-2 bg-[#F8FAFC] border border-slate-100 p-4 rounded-2xl">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Submitted Message</span>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-semibold">
                    {selectedSub.message || "No message body provided."}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 mt-2">
                  {selectedSub.status === "pending" ? (
                    <button
                      onClick={() => handleUpdateStatus(selectedSub.id, "resolved")}
                      className="w-full bg-[#1E293B] hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <IconCheck className="w-4 h-4" /> Mark as Resolved / Addressed
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(selectedSub.id, "pending")}
                      className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <IconClock className="w-4 h-4 text-orange-500" /> Re-open Ticket
                    </button>
                  )}

                  <a 
                    href={`mailto:${selectedSub.email}`}
                    className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-2.5 rounded-xl text-xs transition-colors block text-center"
                  >
                    Reply via Email
                  </a>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 shadow-sm text-center text-slate-400 text-xs font-semibold">
                Select an item from the feed to view full details.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

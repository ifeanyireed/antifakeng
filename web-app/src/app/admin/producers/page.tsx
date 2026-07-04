"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconSearch,
  IconBuildingStore,
  IconCheck,
  IconX,
  IconShield,
  IconLock,
  IconAlertCircle
} from "@tabler/icons-react";

export default function AdminProducers() {
  const [producers, setProducers] = useState([
    { id: 1, name: "Aura Labs Inc", plan: "Standard", codeLimit: 100000, codesUsed: 25000, status: "Active", date: "June 10, 2026" },
    { id: 2, name: "Vitals Pharma Co", plan: "Enterprise", codeLimit: 1000000, codesUsed: 742190, status: "Active", date: "June 12, 2026" },
    { id: 3, name: "Lagos Skincare Ltd", plan: "Growth", codeLimit: 50000, codesUsed: 12010, status: "Suspended", date: "June 15, 2026" },
    { id: 4, name: "AfroCosmetics Group", plan: "Growth", codeLimit: 50000, codesUsed: 0, status: "Pending Approval", date: "July 03, 2026" }
  ]);

  const [selectedProducerId, setSelectedProducerId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState("Growth");
  const [editStatus, setEditStatus] = useState("Active");

  const selectedProducer = producers.find(p => p.id === selectedProducerId);

  const handleEditOpen = (id: number) => {
    const prod = producers.find(p => p.id === id);
    if (prod) {
      setSelectedProducerId(id);
      setEditPlan(prod.plan);
      setEditStatus(prod.status);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducerId !== null) {
      setProducers(prev => prev.map(p => {
        if (p.id === selectedProducerId) {
          const codeLimit = editPlan === "Enterprise" ? 1000000 : editPlan === "Growth" ? 50000 : editPlan === "Standard" ? 100000 : 25000;
          return {
            ...p,
            plan: editPlan,
            status: editStatus,
            codeLimit
          };
        }
        return p;
      }));
      setIsEditModalOpen(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight text-display">Producers &amp; Tenants</h2>
          <p className="text-slate-500 font-medium mt-1">
            Activate multi-tenant producer profiles, adjust usage limits, and monitor resource consumption.
          </p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200/60 rounded-[32px] overflow-hidden shadow-sm flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search producer brands..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0089C1] focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Brand Producer</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Plan Tier</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Codes Issued / Limit</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Status</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Registered Date</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {producers.map((p) => {
                const percentUsed = Math.round((p.codesUsed / p.codeLimit) * 100);
                return (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        <IconBuildingStore className="w-4 h-4" />
                      </div>
                      {p.name}
                    </td>
                    <td className="p-4 font-bold text-[#0089C1]">{p.plan}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 max-w-xs">
                        <div className="flex justify-between font-bold text-slate-600 text-[10px]">
                          <span>{p.codesUsed.toLocaleString()}</span>
                          <span>{p.codeLimit.toLocaleString()} ({percentUsed}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className={
                            percentUsed > 80 ? "bg-red-500 h-full rounded-full" : percentUsed > 50 ? "bg-orange-500 h-full rounded-full" : "bg-emerald-500 h-full rounded-full"
                          } style={{ width: `${percentUsed}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                        p.status === "Active"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : p.status === "Suspended"
                          ? "bg-red-50 text-red-600 border-red-100"
                          : "bg-yellow-50 text-yellow-600 border-yellow-100"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-400">{p.date}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleEditOpen(p.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl font-bold text-[10px] uppercase hover:text-slate-800 transition-all"
                      >
                        Manage Tenant
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Tenant Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedProducer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white border border-slate-200/80 rounded-[32px] p-6 shadow-2xl relative z-10 text-left flex flex-col gap-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-800 text-display">Manage tenant: {selectedProducer.name}</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Subscription Plan</label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0089C1] focus:bg-white"
                  >
                    <option value="Growth">Growth (50k codes limit)</option>
                    <option value="Standard">Standard (100k codes limit)</option>
                    <option value="Enterprise">Enterprise (1M codes limit)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tenant Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0089C1] focus:bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended (Locks login &amp; alerts)</option>
                    <option value="Pending Approval">Pending Approval</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all font-bold py-3.5 rounded-full text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold py-3.5 rounded-full text-xs shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

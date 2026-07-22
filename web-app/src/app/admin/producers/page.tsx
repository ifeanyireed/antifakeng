"use client";

import React, { useState, useEffect } from "react";
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
import { api } from "@/lib/api";
import { AhnaraLoader } from "@/components/ahnara/AhnaraLoader";

export default function AdminProducers() {
  const [producers, setProducers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedProducerId, setSelectedProducerId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState("growth");
  const [editStatus, setEditStatus] = useState("active");

  const fetchProducers = async () => {
    try {
      setIsLoading(true);
      const data = await api.get("/producer/admin/producers");
      setProducers(data || []);
    } catch (err) {
      console.error("Failed to load producers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducers();
  }, []);

  const selectedProducer = producers.find(p => p.id === selectedProducerId);

  const handleEditOpen = (id: number) => {
    const prod = producers.find(p => p.id === id);
    if (prod) {
      setSelectedProducerId(id);
      setEditPlan(prod.plan_tier || "growth");
      setEditStatus(prod.status || "active");
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducerId !== null) {
      try {
        setIsSubmitting(true);
        await api.put(`/producer/admin/producers/${selectedProducerId}`, {
          plan_tier: editPlan.toLowerCase(),
          status: editStatus.toLowerCase()
        });
        setIsEditModalOpen(false);
        await fetchProducers();
      } catch (err) {
        console.error("Failed to update producer settings:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDeleteProducer = async () => {
    if (selectedProducerId === null) return;
    
    const confirmDelete = window.confirm(
      `⚠️ WARNING: Are you sure you want to permanently delete this producer (${selectedProducer?.name})?\n\nThis will instantly delete ALL users, products, batches, QR codes, scan histories, and counterfeit reports associated with this brand. This action CANNOT be undone.`
    );
    
    if (!confirmDelete) return;

    try {
      setIsSubmitting(true);
      await api.delete(`/producer/admin/producers/${selectedProducerId}`);
      setIsEditModalOpen(false);
      await fetchProducers();
    } catch (err) {
      console.error("Failed to delete producer:", err);
      alert("Failed to delete producer from the database. See console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducers = (producers || []).filter((p: any) =>
    p && (
      (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.slug || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.contact_email || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="w-full flex flex-col gap-6 text-left animate-fade-in">
      
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-ahnara-brand focus:bg-white"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4">
            <AhnaraLoader label="Synchronizing Tenants..." />
          </div>
        ) : (
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
                {filteredProducers.length > 0 ? (
                  filteredProducers.map((p) => {
                    const planName = p.plan_tier ? p.plan_tier.charAt(0).toUpperCase() + p.plan_tier.slice(1).toLowerCase() : "Free";
                    const planTier = p.plan_tier?.toLowerCase() || "";
                    const codeLimit = p.allowed_qr_limit > 0 ? p.allowed_qr_limit : (planTier === "free" ? 0 : planTier === "starter" ? 25000 : planTier === "growth" ? 250000 : 1000000);
                    const codesUsed = p.codes_generated || 0;
                    const percentUsed = codeLimit > 0 ? Math.round((codesUsed / codeLimit) * 100) : 0;
                    
                    let formattedDate = "N/A";
                    if (p.created_at) {
                      const d = new Date(p.created_at);
                      if (!isNaN(d.getTime())) {
                        formattedDate = d.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        });
                      }
                    }

                    let statusStr = "Active";
                    if (p.status === "kyc_approved") {
                      statusStr = "KYC Approved";
                    } else if (p.status) {
                      statusStr = p.status.charAt(0).toUpperCase() + p.status.slice(1).toLowerCase().replace("_", " ");
                    }

                    return (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-800 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden">
                            {p.brand_logo_url ? (
                              <img src={p.brand_logo_url} alt={p.name} className="w-full h-full object-contain" />
                            ) : (
                              <IconBuildingStore className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span>{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{p.contact_email}</span>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-[#0089C1]">{planName}</td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1 max-w-xs">
                            <div className="flex justify-between font-bold text-slate-600 text-[10px]">
                              <span>{codesUsed.toLocaleString()}</span>
                              <span>{p.plan_tier === "enterprise" ? "Unlimited" : `${codeLimit.toLocaleString()} (${percentUsed}%)`}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className={
                                percentUsed > 80 ? "bg-red-500 h-full rounded-full" : percentUsed > 50 ? "bg-orange-500 h-full rounded-full" : "bg-emerald-500 h-full rounded-full"
                              } style={{ width: p.plan_tier === "enterprise" ? "10%" : `${Math.min(percentUsed, 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                            statusStr === "Active"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : statusStr === "Suspended"
                              ? "bg-red-50 text-red-600 border-red-100"
                              : statusStr === "KYC Approved"
                              ? "bg-sky-50 text-sky-600 border-sky-100"
                              : "bg-yellow-50 text-yellow-600 border-yellow-100"
                          }`}>
                            {statusStr}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-400">{formattedDate}</td>
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
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 font-semibold">
                      No brands registered on AntiFakeNG.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-ahnara-brand focus:bg-white"
                  >
                    <option value="free">Free (0 codes limit/Inactive)</option>
                    <option value="starter">Starter (25k codes limit)</option>
                    <option value="growth">Growth (250k codes limit)</option>
                    <option value="enterprise">Enterprise (Unlimited codes limit)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tenant Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-ahnara-brand focus:bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended (Locks login &amp; alerts)</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="pending_payment">Pending Payment</option>
                    <option value="kyc_approved">KYC Approved</option>
                  </select>
                </div>

                {/* KYC Verification Documents Section */}
                <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">KYC Compliance Documents</label>
                  
                  {selectedProducer.id_card_url || selectedProducer.selfie_url || selectedProducer.utility_bill_url ? (
                    <div className="grid grid-cols-3 gap-2">
                      {/* ID Card */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">NIN/ID</span>
                        {selectedProducer.id_card_url ? (
                          <a href={selectedProducer.id_card_url} target="_blank" rel="noopener noreferrer" className="relative group aspect-[4/3] rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center hover:border-slate-400 transition-all">
                            <img src={selectedProducer.id_card_url} alt="ID Card" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] font-bold text-white">View</div>
                          </a>
                        ) : (
                          <div className="aspect-[4/3] rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-[9px]">Missing</div>
                        )}
                      </div>

                      {/* Selfie */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Selfie</span>
                        {selectedProducer.selfie_url ? (
                          <a href={selectedProducer.selfie_url} target="_blank" rel="noopener noreferrer" className="relative group aspect-[4/3] rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center hover:border-slate-400 transition-all">
                            <img src={selectedProducer.selfie_url} alt="Selfie" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] font-bold text-white">View</div>
                          </a>
                        ) : (
                          <div className="aspect-[4/3] rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-[9px]">Missing</div>
                        )}
                      </div>

                      {/* Utility Bill */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Utility</span>
                        {selectedProducer.utility_bill_url ? (
                          <a href={selectedProducer.utility_bill_url} target="_blank" rel="noopener noreferrer" className="relative group aspect-[4/3] rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center hover:border-slate-400 transition-all">
                            <img src={selectedProducer.utility_bill_url} alt="Utility Bill" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] font-bold text-white">View</div>
                          </a>
                        ) : (
                          <div className="aspect-[4/3] rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-[9px]">Missing</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center text-slate-400 text-[10px] font-semibold">
                      No KYC compliance documents uploaded yet.
                    </div>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="border-t border-red-100 pt-4 mt-2 flex flex-col gap-2">
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Danger Zone</span>
                  <button
                    type="button"
                    onClick={handleDeleteProducer}
                    disabled={isSubmitting}
                    className="w-full bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    Delete Tenant Account
                  </button>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all font-bold py-3.5 rounded-full text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold py-3.5 rounded-full text-xs shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
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

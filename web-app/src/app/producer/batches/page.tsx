"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconPlus,
  IconSearch,
  IconQrcode,
  IconDownload,
  IconAlertCircle,
  IconX,
  IconCheck,
  IconLock
} from "@tabler/icons-react";

export default function ProducerBatches() {
  const [batches, setBatches] = useState([
    { id: "B-AURA2606", product: "AURA Skincare Serum 50ml", count: 10000, status: "Active", date: "June 20, 2026", scans: 14210 },
    { id: "B-CLEAN01", product: "AURA Cleanser 100ml", count: 5000, status: "Active", date: "June 22, 2026", scans: 5120 },
    { id: "B-HYDRA04", product: "Hydra Essence", count: 8000, status: "Active", date: "June 25, 2026", scans: 5482 },
    { id: "B-RETIN02", product: "Retinol Therapy Gel", count: 2000, status: "Draft", date: "July 01, 2026", scans: 0 }
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("AURA Skincare Serum 50ml");
  const [codeQuantity, setCodeQuantity] = useState("1000");
  const [batchId, setBatchId] = useState("");

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeQuantity && selectedProduct) {
      const generatedId = batchId || `B-${selectedProduct.slice(0, 5).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
      setBatches([
        {
          id: generatedId,
          product: selectedProduct,
          count: parseInt(codeQuantity),
          status: "Active",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
          scans: 0
        },
        ...batches
      ]);
      setBatchId("");
      setCodeQuantity("1000");
      setIsCreateModalOpen(false);
    }
  };

  const handleRecallBatch = (id: string) => {
    if (confirm(`Are you sure you want to RECALL all codes in batch ${id}? This action is immediate and will notify all consumers scanning these codes.`)) {
      setBatches(prev => prev.map(b => b.id === id ? { ...b, status: "Recalled" } : b));
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight text-display">Production Batches</h2>
          <p className="text-slate-500 font-medium mt-1">
            Issue cryptographically random serial codes for physical labels and execute recalls if needed.
          </p>
        </div>
        
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold px-5 py-3 rounded-full text-xs shadow-md flex items-center gap-1.5 self-start sm:self-auto"
        >
          <IconPlus className="w-4 h-4" />
          Create Production Batch
        </button>
      </div>

      {/* Batches Table Card */}
      <div className="bg-white border border-slate-200/60 rounded-[32px] overflow-hidden shadow-sm flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search batches..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0089C1] focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Batch ID</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Associated Product</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Codes Issued</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Scanned</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Status</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Created Date</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-800">{b.id}</td>
                  <td className="p-4 font-bold text-slate-700">{b.product}</td>
                  <td className="p-4 font-bold text-slate-600">{b.count.toLocaleString()}</td>
                  <td className="p-4 font-bold text-slate-500">{b.scans.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                      b.status === "Active" 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                        : b.status === "Draft"
                        ? "bg-slate-100 text-slate-500 border-slate-200"
                        : "bg-red-50 text-red-600 border-red-100"
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-400">{b.date}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button 
                        className="p-1.5 text-slate-400 hover:text-[#0089C1] hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 font-bold text-[10px] uppercase"
                        onClick={() => alert(`Downloading print package ZIP for batch ${b.id}... Includes high-res PDF and CSV of serial verification keys.`)}
                      >
                        <IconDownload className="w-3.5 h-3.5" />
                        Print Layout
                      </button>
                      {b.status === "Active" && (
                        <button 
                          onClick={() => handleRecallBatch(b.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 font-bold text-[10px] uppercase"
                        >
                          <IconAlertCircle className="w-3.5 h-3.5" />
                          Recall
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Batch Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white border border-slate-200/80 rounded-[32px] p-6 shadow-2xl relative z-10 text-left flex flex-col gap-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-800 text-display">Issue Serial Codes</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateBatch} className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Select Product</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0089C1] focus:bg-white"
                  >
                    <option value="AURA Skincare Serum 50ml">AURA Skincare Serum 50ml</option>
                    <option value="AURA Cleanser 100ml">AURA Cleanser 100ml</option>
                    <option value="Hydra Essence">Hydra Essence</option>
                    <option value="Retinol Therapy Gel">Retinol Therapy Gel</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Quantity of Codes to Generate</label>
                  <input
                    type="number"
                    value={codeQuantity}
                    onChange={(e) => setCodeQuantity(e.target.value)}
                    placeholder="e.g. 5000"
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0089C1] focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Custom Batch ID (Optional)</label>
                  <input
                    type="text"
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value.toUpperCase())}
                    placeholder="e.g. B-AURA-LOT3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0089C1] focus:bg-white"
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all font-bold py-3.5 rounded-full text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold py-3.5 rounded-full text-xs shadow-md"
                  >
                    Generate &amp; Create Batch
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

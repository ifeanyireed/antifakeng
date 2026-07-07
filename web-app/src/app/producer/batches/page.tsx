"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import {
  IconPlus,
  IconSearch,
  IconQrcode,
  IconDownload,
  IconAlertCircle,
  IconX,
  IconCheck,
  IconLock,
  IconSettings,
  IconPrinter
} from "@tabler/icons-react";

export default function ProducerBatches() {
  const [products, setProducts] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodData = await api.get("/producer/products");
        setProducts(prodData || []);
        if (prodData && prodData.length > 0) {
          setSelectedProduct(String(prodData[0].id));
        }

        const batchData = await api.get("/producer/batches");
        setBatches(batchData || []);
      } catch (err) {
        console.error("Failed to load products/batches:", err);
      }
    };
    fetchData();
  }, []);

  // Helper date functions
  const getTodayString = () => {
    return new Date().toISOString().split("T")[0];
  };
  const getTwoYearsString = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().split("T")[0];
  };

  // Create Batch states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [codeQuantity, setCodeQuantity] = useState("1000");
  const [batchId, setBatchId] = useState("");
  const [manufactureDate, setManufactureDate] = useState(getTodayString());
  const [expiryDate, setExpiryDate] = useState(getTwoYearsString());
  
  // Custom label background states
  const [labelImage, setLabelImage] = useState("");
  const [labelRotation, setLabelRotation] = useState(0); // 0, 90, 180, 270
  const [qrPosition, setQrPosition] = useState("bottom-right"); // top-left, top-right, bottom-left, bottom-right
  const [isUploadingLabel, setIsUploadingLabel] = useState(false);

  const handleLabelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("image", file);
      
      try {
        setIsUploadingLabel(true);
        const data = await api.upload("/producer/upload", formData);
        setLabelImage(data.url);
      } catch (err: any) {
        console.error("Failed to upload label image:", err);
        alert(err.message || "Failed to upload label image.");
      } finally {
        setIsUploadingLabel(false);
      }
    }
  };

  // Print Layout states
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activePrintBatch, setActivePrintBatch] = useState<any>(null);
  const [printMessage, setPrintMessage] = useState("Scan QR code or visit www.antifake.ng/verify, input serial to check authenticity. Insist on adding your own number for accurate validation & loyalty rewards.");
  const [layoutWidth, setLayoutWidth] = useState("4ft");
  const [customWidth, setCustomWidth] = useState("48");
  const [customWidthUnit, setCustomWidthUnit] = useState("inch");
  const [fileFormat, setFileFormat] = useState("pdf");
  const [isGenerating, setIsGenerating] = useState(false);

  const getRollWidthMM = () => {
    if (layoutWidth === "4ft") return 1219.2;
    if (layoutWidth === "6ft") return 1828.8;
    if (layoutWidth === "10ft") return 3048.0;
    if (layoutWidth === "custom") {
      const val = parseFloat(customWidth) || 0;
      if (customWidthUnit === "inch") return val * 25.4;
      if (customWidthUnit === "ft") return val * 304.8;
      if (customWidthUnit === "cm") return val * 10;
    }
    return 1219.2;
  };

  const getDynamicColumns = () => {
    const rollWidthMM = getRollWidthMM();
    const labelWidthMM = 80;
    const spacingMM = 0.26; // 1px = ~0.26mm
    return Math.floor((rollWidthMM + spacingMM) / (labelWidthMM + spacingMM)) || 1;
  };
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [tokensList, setTokensList] = useState<any[]>([]);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codeQuantity && selectedProduct) {
      try {
        const qty = parseInt(codeQuantity);
        const code = batchId || `B-${Math.floor(Math.random() * 90000 + 10000)}`;
        
        // Create batch record with custom label parameters
        const createdBatch = await api.post("/producer/batches", {
          product_id: parseInt(selectedProduct),
          batch_code: code,
          quantity: qty,
          manufacture_date: manufactureDate ? new Date(manufactureDate).toISOString() : undefined,
          expiry_date: expiryDate ? new Date(expiryDate).toISOString() : undefined,
          label_image_url: labelImage || undefined,
          label_rotation: labelRotation,
          qr_position: qrPosition,
          status: "active"
        });
        
        // Auto-generate tokens
        await api.post(`/producer/batches/${createdBatch.id}/generate`, {});
        
        // Reload batches
        const data = await api.get("/producer/batches");
        setBatches(data || []);
        
        setBatchId("");
        setCodeQuantity("1000");
        setManufactureDate(getTodayString());
        setExpiryDate(getTwoYearsString());
        setLabelImage("");
        setLabelRotation(0);
        setQrPosition("bottom-right");
        setIsCreateModalOpen(false);
      } catch (err: any) {
        alert(err.message || "Failed to create batch.");
      }
    }
  };

  const handleRecallBatch = async (code: string, dbId: number) => {
    if (confirm(`Are you sure you want to RECALL all codes in batch ${code}? This action is immediate and will notify all consumers scanning these codes.`)) {
      try {
        await api.post(`/producer/batches/${dbId}/recall`, {});
        const data = await api.get("/producer/batches");
        setBatches(data || []);
      } catch (err: any) {
        alert(err.message || "Failed to recall batch.");
      }
    }
  };

  const handlePrintLayoutClick = (batch: any) => {
    setActivePrintBatch(batch);
    setIsPrintModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const textToDownload = previewText || tokensList.map(t => `${t.token},https://antifake.ng/verify?token=${t.token}`).join("\n");
    const blob = new Blob([textToDownload], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `antifake-print-${activePrintBatch?.batch_code}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartGeneration = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("ahnara_token") : "";
      
      if (activePrintBatch?.id && token) {
        // Fetch real QR code tokens from the backend
        const codes = await api.get(`/producer/batches/${activePrintBatch.id}/qr-codes`);
        setTokensList(codes || []);
        setPreviewUrl("html"); // Renders HTML print sheet preview inside the modal
        setPreviewText("");
      } else {
        // Fallback: Generate mock tokens for preview
        const count = activePrintBatch?.quantity || 24;
        const mockCodes = Array.from({ length: Math.min(count, 100) }, (_, i) => ({
          token: `MOCK-${activePrintBatch?.batch_code || "TEST"}-${1000 + i}`,
          status: "active"
        }));
        setTokensList(mockCodes);
        setPreviewUrl("html");
        setPreviewText("");
      }

      // Complete generation progress
      setTimeout(() => {
        clearInterval(interval);
        setIsGenerating(false);
        setIsPrintModalOpen(false);
        setIsPreviewModalOpen(true);
      }, 1100);

    } catch (err: any) {
      clearInterval(interval);
      setIsGenerating(false);
      alert(err.message || "Failed to fetch QR codes for print layout.");
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
              {batches.map((b) => {
                const prod = products.find(p => p.id === b.product_id);
                const productName = prod ? prod.name : "Unknown Product";
                const isAct = b.status?.toLowerCase() === "active";
                return (
                  <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-800">{b.batch_code}</td>
                    <td className="p-4 font-bold text-slate-700">{productName}</td>
                    <td className="p-4 font-bold text-slate-600">{b.quantity?.toLocaleString() || "0"}</td>
                    <td className="p-4 font-bold text-slate-500">{(b.scans || 0).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                        isAct 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : b.status?.toLowerCase() === "draft"
                          ? "bg-slate-100 text-slate-500 border-slate-200"
                          : "bg-red-50 text-red-600 border-red-100"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-400">
                      {b.created_at 
                        ? new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) 
                        : b.date || "---"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          className="p-1.5 text-slate-400 hover:text-[#0089C1] hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 font-bold text-[10px] uppercase"
                          onClick={() => handlePrintLayoutClick(b)}
                        >
                          <IconDownload className="w-3.5 h-3.5" />
                          Print Layout
                        </button>
                        {isAct && (
                          <button 
                            onClick={() => handleRecallBatch(b.batch_code, b.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 font-bold text-[10px] uppercase"
                          >
                            <IconAlertCircle className="w-3.5 h-3.5" />
                            Recall
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Manufacture Date</label>
                    <input
                      type="date"
                      value={manufactureDate}
                      onChange={(e) => setManufactureDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0089C1] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0089C1] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Custom Print Label Configuration */}
                <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Custom Print Label (Optional)</span>
                  
                  <div className="flex flex-col gap-2 bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Upload Label Graphic</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLabelUpload}
                          className="text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                        />
                      </div>
                      {labelImage && (
                        <div className="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-white flex items-center justify-center">
                          <img
                            src={labelImage}
                            alt="Label Preview"
                            style={{ transform: `rotate(${labelRotation}deg)` }}
                            className="w-full h-full object-contain transition-transform duration-200"
                          />
                        </div>
                      )}
                    </div>

                    {isUploadingLabel && <div className="text-[10px] text-slate-500 italic mt-1">Uploading label graphic...</div>}

                    {labelImage && (
                      <div className="grid grid-cols-2 gap-3 mt-2 border-t border-slate-200/50 pt-2">
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Rotation</label>
                          <select
                            value={labelRotation}
                            onChange={(e) => setLabelRotation(parseInt(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-[10px] font-bold text-slate-800 focus:outline-none focus:border-[#0089C1]"
                          >
                            <option value="0">0° (Normal)</option>
                            <option value="90">90° Right</option>
                            <option value="180">180° Upside Down</option>
                            <option value="270">270° Left</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">QR Corner Position</label>
                          <select
                            value={qrPosition}
                            onChange={(e) => setQrPosition(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-[10px] font-bold text-slate-800 focus:outline-none focus:border-[#0089C1]"
                          >
                            <option value="top-left">Top-Left</option>
                            <option value="top-right">Top-Right</option>
                            <option value="bottom-left">Bottom-Left</option>
                            <option value="bottom-right">Bottom-Right</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
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

      {/* Print Layout Customization Modal */}
      <AnimatePresence>
        {isPrintModalOpen && activePrintBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isGenerating && setIsPrintModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-4xl bg-white border border-slate-200/80 rounded-[32px] p-6 shadow-2xl relative z-10 text-left flex flex-col gap-6"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-black text-slate-800 text-display flex items-center gap-2">
                    <IconPrinter className="w-5 h-5 text-slate-500" />
                    Configure Print Layout (Batch: {activePrintBatch.batch_code} — {activePrintBatch.quantity} Codes)
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">Customize roll widths, messages, and output formats for print runs.</p>
                </div>
                {!isGenerating && (
                  <button
                    onClick={() => setIsPrintModalOpen(false)}
                    className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
                  >
                    <IconX className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isGenerating ? (
                /* Generation Status */
                <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center animate-spin">
                    <IconPrinter className="w-8 h-8 text-[#0089C1]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800">Generating Print Package...</h4>
                    <p className="text-slate-400 text-sm mt-0.5">Structuring high-resolution codes and formatting grid pages.</p>
                  </div>
                  <div className="w-64 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 mt-2">
                    <div className="h-full bg-[#0089C1] rounded-full transition-all duration-150" style={{ width: `${generationProgress}%` }} />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">{generationProgress}% Completed</span>
                </div>
              ) : (
                /* Main Configuration Split Workspace */
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left Column - Form Parameters (7 Cols) */}
                  <div className="md:col-span-7 flex flex-col gap-4">
                    
                    {/* Custom Message input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Printed Label Message</label>
                      <textarea
                        value={printMessage}
                        onChange={(e) => setPrintMessage(e.target.value)}
                        rows={2}
                        disabled={isGenerating}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0089C1] focus:bg-white resize-none leading-normal disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Message printed next to each code..."
                      />
                    </div>

                    {/* Width / Roll Layout configuration */}
                    <div className="py-2">
                      <p className="text-[10px] text-slate-400 font-bold leading-normal">
                        * Spacing between individual cards is automatically set to exactly 1px (TBLR) and columns are dynamically auto-fitted to cover your roll width.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Layout Roll Width</label>
                        <select
                          value={layoutWidth}
                          onChange={(e) => setLayoutWidth(e.target.value)}
                          disabled={isGenerating}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0089C1] focus:bg-white disabled:opacity-60"
                        >
                          <option value="4ft">4ft Roll (approx. 120cm)</option>
                          <option value="6ft">6ft Roll (approx. 180cm)</option>
                          <option value="10ft">10ft Industrial Roll (approx. 300cm)</option>
                          <option value="custom">Custom Width...</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Output File Format</label>
                        <select
                          value={fileFormat}
                          onChange={(e) => setFileFormat(e.target.value)}
                          disabled={isGenerating}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0089C1] focus:bg-white disabled:opacity-60"
                        >
                          <option value="pdf">Vector PDF (CMYK Print Ready)</option>
                          <option value="png_zip">High-Res PNG Sheets (ZIP)</option>
                          <option value="csv">CSV Keys (Codes Only)</option>
                        </select>
                      </div>
                    </div>

                    {/* Custom Width Input (Only visible when "custom" selected) */}
                    {layoutWidth === "custom" && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Width Value</label>
                          <input
                            type="number"
                            value={customWidth}
                            onChange={(e) => setCustomWidth(e.target.value)}
                            disabled={isGenerating}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#0089C1] disabled:opacity-60"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</label>
                          <select
                            value={customWidthUnit}
                            onChange={(e) => setCustomWidthUnit(e.target.value)}
                            disabled={isGenerating}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 outline-none disabled:opacity-60"
                          >
                            <option value="inch">Inches (in)</option>
                            <option value="ft">Feet (ft)</option>
                            <option value="cm">Centimeters (cm)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 mt-4 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsPrintModalOpen(false)}
                        disabled={isGenerating}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all font-bold py-3.5 rounded-full text-xs text-center disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleStartGeneration}
                        disabled={isGenerating}
                        className="flex-1 bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold py-3.5 rounded-full text-xs shadow-md disabled:opacity-60"
                      >
                        Generate &amp; Preview
                      </button>
                    </div>
                  </div>

                  {/* Right Column - Live Visual Preview Workspace (5 Cols) */}
                  <div className="md:col-span-5 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col gap-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Live Preview</h4>
                    
                    {/* Live Label Item Rendering */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-row items-stretch overflow-hidden h-[135px]">
                      {/* Left: QR code section */}
                      <div className="w-[100px] flex-none bg-slate-50/50 border-r border-slate-100 flex items-center justify-center p-3">
                        <div className="w-16 h-16 bg-white border border-slate-200/80 flex items-center justify-center rounded-lg p-1.5 shadow-xs">
                          <IconQrcode className="w-full h-full text-slate-800" />
                        </div>
                      </div>

                      {/* Right: Text and metadata section */}
                      <div className="flex-1 flex flex-col p-3.5 justify-between">
                        <div>
                          {/* Serial Code header */}
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            SERIAL: <span className="font-mono text-slate-800 font-extrabold ml-1">XXXX-XXXX</span>
                          </div>

                          {/* Instructions using IBM Plex Sans font */}
                          <p className="text-[11px] text-slate-500 font-medium leading-tight font-ibm mt-1 max-w-[220px]">
                            {printMessage || "(No message specified)"}
                          </p>
                        </div>

                        {/* Middle-bottom: Logo and Name */}
                        <div className="flex items-center gap-2 py-0.5">
                          <img src="/logo.png" alt="AntiFakeNG Logo" className="w-5.5 h-5.5 object-contain" />
                          <span className="text-xs font-black text-[#12213B] tracking-tight">AntiFakeNG</span>
                        </div>

                        {/* Bottom: Blue secure verification portal footer */}
                        <div className="text-[8px] text-[#0089C1] font-black tracking-wider uppercase">
                          SECURE VERIFICATION PORTAL
                        </div>
                      </div>
                    </div>

                    {/* Industrial Roll Layout schematic */}
                    <div className="flex-1 flex flex-col gap-2 justify-center border border-dashed border-slate-200 rounded-xl p-4 bg-white/50">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>Roll Layout: {layoutWidth === "custom" ? `${customWidth} ${customWidthUnit}` : layoutWidth} Width</span>
                        <span>{getDynamicColumns()} Columns (Auto-fit)</span>
                      </div>
                      
                      {/* Visual grid rendering */}
                      <div className="w-full h-24 bg-white border border-slate-200 rounded-md relative p-2 flex flex-col gap-1 overflow-hidden">
                        {[...Array(3)].map((_, r) => (
                          <div key={r} className="flex gap-1 justify-between">
                            {[...Array(Math.min(getDynamicColumns(), 20))].map((_, c) => (
                              <div key={c} className="w-2.5 h-2.5 bg-slate-100 border border-slate-200/80 rounded-xs flex items-center justify-center p-0.5">
                                <div className="w-full h-full bg-slate-400/50 rounded-xs" />
                              </div>
                            ))}
                          </div>
                        ))}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent pointer-events-none" />
                      </div>
                    </div>

                  </div>

                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document/PDF Preview Modal */}
      <AnimatePresence>
        {isPreviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreviewModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-5xl bg-white border border-slate-200/80 rounded-[32px] p-6 shadow-2xl relative z-10 text-left flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 animate-fade-in">
                <div>
                  <div className="flex items-center gap-2">
                    <IconPrinter className="w-5 h-5 text-slate-500" />
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight text-display">Print Layout Preview</h3>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Review generated layouts. You can print directly from the viewer or download the file.
                  </p>
                </div>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content / Preview Area */}
              <div className="bg-slate-100 border border-slate-200/80 rounded-2xl overflow-auto p-6 max-h-[60vh] flex items-start justify-center">
                {previewUrl === "html" ? (
                  <div className="flex flex-col gap-4 w-full">
                    <div
                      className="grid gap-[1px] justify-start overflow-auto"
                      style={{
                        gridTemplateColumns: `repeat(${getDynamicColumns()}, 80mm)`,
                        width: "fit-content",
                        maxWidth: "100%",
                      }}
                    >
                      {tokensList.slice(0, 100).map((tokenObj, idx) => (
                        <div
                          key={idx}
                          className="w-[80mm] h-[40mm] border border-slate-200 rounded-lg flex overflow-hidden p-2 bg-white text-slate-800 shrink-0 select-none shadow-xs mx-auto"
                        >
                          {/* Left: QR Code */}
                          <div className="w-[34mm] h-[34mm] flex items-center justify-center bg-slate-50 border border-slate-100 rounded-md p-[2px]">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(`https://antifake.ng/verify?token=${tokenObj.token}`)}`}
                              alt="QR Code"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          {/* Right: Metadata */}
                          <div className="flex-1 flex flex-col justify-between pl-3 text-left">
                            <div>
                              <div className="text-[10px] font-black text-slate-500 tracking-wider uppercase">
                                SERIAL: <span className="font-mono text-slate-800 font-extrabold">{tokenObj.token}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 font-medium leading-tight mt-1">
                                {printMessage || "Scan QR code or visit antifake.ng/verify, input serial to check authenticity."}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 py-0.5">
                              <img src="/logo.png" alt="Logo" className="w-5.5 h-5.5 object-contain" />
                              <span className="text-xs font-black text-[#12213B] tracking-tight">AntiFakeNG</span>
                            </div>
                            <div className="text-[8px] text-[#0089C1] font-black tracking-wider uppercase">
                              SECURE VERIFICATION PORTAL
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {tokensList.length > 100 && (
                      <div className="bg-slate-200/60 border border-slate-300/40 rounded-xl p-3 text-center text-xs font-bold text-slate-600">
                        ⚠️ Preview is limited to the first 100 labels to preserve browser performance. All {tokensList.length} labels will be printed when you click "Print / Save as PDF".
                      </div>
                    )}
                  </div>
                ) : previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[60vh] border-0"
                    title="Print PDF Preview"
                  />
                ) : (
                  <div className="w-full p-6">
                    <pre className="bg-slate-900 text-slate-100 p-6 rounded-2xl overflow-auto text-xs font-mono max-h-[50vh] text-left">
                      {previewText}
                    </pre>
                  </div>
                )}
              </div>

              {/* Modal Footer / Actions */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all font-bold px-6 py-3 rounded-full text-xs"
                >
                  Close Preview
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all font-bold px-6 py-3 rounded-full text-xs flex items-center gap-1.5"
                  >
                    <IconDownload className="w-4 h-4" />
                    Export CSV / Keys
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold px-6 py-3 rounded-full text-xs shadow-md flex items-center gap-1.5 animate-bounce-subtle"
                  >
                    <IconPrinter className="w-4 h-4" />
                    Print / Save as PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Print Container rendered as body level portal specifically targeted by @media print */}
      {isPreviewModalOpen && typeof document !== "undefined" && createPortal(
        <div id="print-layout-container" className="hidden print:block bg-white p-4">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body {
                background: white !important;
                color: #000000 !important;
              }
              /* Hide the main Next.js layout root and modals */
              body > *:not(#print-layout-container) {
                display: none !important;
              }
              #print-layout-container {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .print-card {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }
          `}} />
          <div
            className="grid gap-[1px] p-[1px]"
            style={{
              gridTemplateColumns: `repeat(${getDynamicColumns()}, 80mm)`,
              width: `${getRollWidthMM()}mm`,
            }}
          >
            {tokensList.map((tokenObj, idx) => (
              <div
                key={idx}
                className="print-card w-[80mm] h-[40mm] border border-slate-300 rounded-lg flex overflow-hidden p-2 bg-white text-slate-800 shrink-0 select-none"
              >
                {/* Left: QR Code */}
                <div className="w-[34mm] h-[34mm] flex items-center justify-center bg-white border border-slate-100 rounded-md p-[2px]">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(`https://antifake.ng/verify?token=${tokenObj.token}`)}`}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                {/* Right: Metadata */}
                <div className="flex-1 flex flex-col justify-between pl-3 text-left">
                  <div>
                    <div className="text-[10px] font-black text-slate-500 tracking-wider uppercase">
                      SERIAL: <span className="font-mono text-slate-800 font-extrabold">{tokenObj.token}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-tight mt-1">
                      {printMessage || "Scan QR code or visit antifake.ng/verify, input serial to check authenticity."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 py-0.5">
                    <img src="/logo.png" alt="Logo" className="w-5.5 h-5.5 object-contain" />
                    <span className="text-xs font-black text-[#12213B] tracking-tight">AntiFakeNG</span>
                  </div>
                  <div className="text-[8px] text-[#0089C1] font-black tracking-wider uppercase">
                    SECURE VERIFICATION PORTAL
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

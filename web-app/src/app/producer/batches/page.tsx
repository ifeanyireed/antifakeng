"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { AhnaraLoader } from "@/components/ahnara/AhnaraLoader";
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
  IconPrinter,
  IconEdit
} from "@tabler/icons-react";

const getJSImagePhysicalWidth = (buffer: ArrayBuffer, pixelWidth: number): number => {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // PNG: Check signature
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    let offset = 8;
    while (offset < view.byteLength) {
      if (offset + 8 > view.byteLength) break;
      const length = view.getUint32(offset);
      const chunkType = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);

      if (chunkType === "pHYs" && length === 9) {
        if (offset + 12 + 9 <= view.byteLength) {
          const pxPerMeterX = view.getUint32(offset + 8);
          const unit = bytes[offset + 16];
          if (unit === 1 && pxPerMeterX > 0) {
            return (pixelWidth / pxPerMeterX) * 1000;
          }
        }
        break;
      } else if (chunkType === "IDAT" || chunkType === "IEND") {
        break;
      }
      offset += 12 + length;
    }
  }
  // JPEG: Check signature
  else if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset < view.byteLength) {
      if (offset + 2 > view.byteLength) break;
      if (bytes[offset] !== 0xff) break;
      const marker = bytes[offset + 1];
      if (marker === 0xd8 || marker === 0xd9 || marker === 0x01) {
        offset += 2;
        continue;
      }
      const length = view.getUint16(offset + 2);
      if (marker === 0xe0 && length >= 16) { // APP0 JFIF
        if (offset + 4 + length <= view.byteLength) {
          const identifier = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7], bytes[offset + 8]);
          if (identifier === "JFIF\0") {
            const units = bytes[offset + 11]; // 1 = DPI, 2 = dots/cm
            const xDensity = view.getUint16(offset + 12);
            if (xDensity > 0) {
              if (units === 1) {
                return (pixelWidth / xDensity) * 25.4;
              } else if (units === 2) {
                return (pixelWidth / xDensity) * 10;
              }
            }
          }
        }
        break;
      }
      offset += 2 + length;
    }
  }
  return 0;
};

const fetchPhysicalWidth = async (url: string, pixelWidth: number, callback: (w: number | null) => void) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const buffer = await res.arrayBuffer();
    const physWidth = getJSImagePhysicalWidth(buffer, pixelWidth);
    callback(physWidth > 0 ? physWidth : null);
  } catch (e) {
    console.error("Failed to fetch or parse image physical width:", e);
    callback(null);
  }
};

export default function ProducerBatches() {
  const [products, setProducts] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

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

        const summaryData = await api.get("/analytics/summary").catch(() => null);
        if (summaryData) {
          setSummary(summaryData);
        }
      } catch (err) {
        console.error("Failed to load products/batches/summary:", err);
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
  const [qrX, setQrX] = useState(80);
  const [qrY, setQrY] = useState(80);
  const [qrScale, setQrScale] = useState(100);
  const [isUploadingLabel, setIsUploadingLabel] = useState(false);

  // Edit Label Modal States
  const [isEditLabelModalOpen, setIsEditLabelModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const [editLabelImage, setEditLabelImage] = useState("");
  const [editLabelRotation, setEditLabelRotation] = useState(0);
  const [editQrX, setEditQrX] = useState(80);
  const [editQrY, setEditQrY] = useState(80);
  const [editQrScale, setEditQrScale] = useState(100);

  // Graphic Dimensions & Units States
  const [dimensionUnit, setDimensionUnit] = useState<"px" | "mm" | "cm" | "in" | "ft">("mm");
  const [labelDimensions, setLabelDimensions] = useState<{ width: number; height: number } | null>(null);
  const [editLabelDimensions, setEditLabelDimensions] = useState<{ width: number; height: number } | null>(null);
  const [labelPhysicalWidth, setLabelPhysicalWidth] = useState<number | null>(null);
  const [editLabelPhysicalWidth, setEditLabelPhysicalWidth] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!labelImage) {
      setLabelDimensions(null);
      setLabelPhysicalWidth(null);
      return;
    }
    const img = new Image();
    img.src = labelImage;
    img.onload = () => {
      setLabelDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      fetchPhysicalWidth(labelImage, img.naturalWidth, setLabelPhysicalWidth);
    };
  }, [labelImage]);

  useEffect(() => {
    if (!editLabelImage) {
      setEditLabelDimensions(null);
      setEditLabelPhysicalWidth(null);
      return;
    }
    const img = new Image();
    img.src = editLabelImage;
    img.onload = () => {
      setEditLabelDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      fetchPhysicalWidth(editLabelImage, img.naturalWidth, setEditLabelPhysicalWidth);
    };
  }, [editLabelImage]);

  const formatDimensions = (
    dims: { width: number; height: number } | null,
    physWidth: number | null,
    unit: "px" | "mm" | "cm" | "in" | "ft"
  ) => {
    if (!dims) return "Detecting...";
    const { width, height } = dims;
    if (unit === "px") {
      return `${width} × ${height} px`;
    }
    const aspectRatio = width / height;
    const baseWidthMM = physWidth && physWidth > 0 ? physWidth : 80;
    const baseHeightMM = baseWidthMM / aspectRatio;

    if (unit === "mm") {
      return `${baseWidthMM.toFixed(1)} × ${baseHeightMM.toFixed(1)} mm`;
    }
    if (unit === "cm") {
      return `${(baseWidthMM / 10).toFixed(2)} × ${(baseHeightMM / 10).toFixed(2)} cm`;
    }
    if (unit === "in") {
      return `${(baseWidthMM / 25.4).toFixed(2)} × ${(baseHeightMM / 25.4).toFixed(2)} in`;
    }
    if (unit === "ft") {
      return `${(baseWidthMM / 304.8).toFixed(3)} × ${(baseHeightMM / 304.8).toFixed(3)} ft`;
    }
    return "";
  };

  const parseQrPositionAndScales = (raw: string) => {
    const parts = (raw || "").split(";");
    const isLegacy = parts[0] && isNaN(Number(parts[0]));
    let x = 80;
    let y = 80;
    let qrScale = 100;
    if (isLegacy) {
      const pos = parts[0] || "bottom-right";
      qrScale = parts[1] ? parseFloat(parts[1]) : 100;
      if (pos === "top-left") { x = 5; y = 5; }
      else if (pos === "top-right") { x = 75; y = 5; }
      else if (pos === "bottom-left") { x = 5; y = 75; }
      else { x = 75; y = 75; }
    } else {
      x = parts[0] !== undefined && parts[0] !== "" ? parseFloat(parts[0]) : 80;
      y = parts[1] !== undefined && parts[1] !== "" ? parseFloat(parts[1]) : 80;
      qrScale = parts[2] !== undefined && parts[2] !== "" ? parseFloat(parts[2]) : 100;
    }
    return { x, y, qrScale };
  };

  const handleEditLabelClick = (batch: any) => {
    setEditingBatch(batch);
    setEditLabelImage(batch.label_image_url || "");
    setEditLabelRotation(batch.label_rotation || 0);
    
    // Parse qr_position
    const { x, y, qrScale: qS } = parseQrPositionAndScales(batch.qr_position);
    setEditQrX(x);
    setEditQrY(y);
    setEditQrScale(qS);
    
    setIsEditLabelModalOpen(true);
  };

  const handleEditLabelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Parse physical width locally from the selected file immediately
      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          const physWidth = getJSImagePhysicalWidth(buffer, img.naturalWidth);
          setEditLabelPhysicalWidth(physWidth > 0 ? physWidth : null);
        };
      };
      reader.readAsArrayBuffer(file);

      const formData = new FormData();
      formData.append("image", file);
      try {
        setIsUploadingLabel(true);
        const data = await api.upload("/producer/upload", formData);
        setEditLabelImage(data.url);
      } catch (err: any) {
        alert(err.message || "Failed to upload image.");
      } finally {
        setIsUploadingLabel(false);
      }
    }
  };

  const handleUpdateLabelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBatch) {
      try {
        setIsSubmitting(true);
        await api.put(`/producer/batches/${editingBatch.id}`, {
          label_image_url: editLabelImage || null,
          label_rotation: editLabelRotation,
          qr_position: `${editQrX};${editQrY};${editQrScale}`
        });

        // Reload batches
        const data = await api.get("/producer/batches");
        setBatches(data || []);

        setIsEditLabelModalOpen(false);
        setEditingBatch(null);
      } catch (err: any) {
        alert(err.message || "Failed to update batch label settings.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleLabelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Parse physical width locally from the selected file immediately
      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          const physWidth = getJSImagePhysicalWidth(buffer, img.naturalWidth);
          setLabelPhysicalWidth(physWidth > 0 ? physWidth : null);
        };
      };
      reader.readAsArrayBuffer(file);

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
  const [activePrintLabelPhysicalWidth, setActivePrintLabelPhysicalWidth] = useState<number | null>(null);
  const [printMessage, setPrintMessage] = useState("Scan QR code or visit www.antifake.ng/verify, input serial to check authenticity.");
  const [layoutWidth, setLayoutWidth] = useState("4ft");
  const [customWidth, setCustomWidth] = useState("48");
  const [customWidthUnit, setCustomWidthUnit] = useState("inch");
  const [fileFormat, setFileFormat] = useState("pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const [columnsMode, setColumnsMode] = useState<"auto" | "manual">("auto");
  const [manualColumns, setManualColumns] = useState<number>(12);

  useEffect(() => {
    if (!activePrintBatch || !activePrintBatch.label_image_url) {
      setActivePrintLabelPhysicalWidth(null);
      return;
    }
    const img = new Image();
    img.src = activePrintBatch.label_image_url;
    img.onload = () => {
      fetchPhysicalWidth(activePrintBatch.label_image_url, img.naturalWidth, setActivePrintLabelPhysicalWidth);
    };
  }, [activePrintBatch]);

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
    const labelWidthMM = activePrintLabelPhysicalWidth && activePrintLabelPhysicalWidth > 0 
      ? activePrintLabelPhysicalWidth 
      : 80;
    const spacingMM = 0.26; // 1px = ~0.26mm
    return Math.floor((rollWidthMM + spacingMM) / (labelWidthMM + spacingMM)) || 1;
  };

  const getSelectedColumns = () => {
    if (columnsMode === "auto") {
      return getDynamicColumns();
    }
    return manualColumns;
  };

  const getPrintLabelWidthMM = () => {
    if (columnsMode === "auto") {
      return activePrintLabelPhysicalWidth && activePrintLabelPhysicalWidth > 0 
        ? activePrintLabelPhysicalWidth 
        : 80;
    }
    const rollWidthMM = getRollWidthMM();
    const spacingMM = 0.26; // 1px = ~0.26mm
    const calculatedWidth = (rollWidthMM + spacingMM) / manualColumns - spacingMM;
    return Math.max(calculatedWidth, 10);
  };

  const getPhysicalQrSizeMM = () => {
    const batch = activePrintBatch;
    if (!batch) return 30;
    const { qrScale } = parseQrPositionAndScales(batch.qr_position);
    const scale = qrScale / 100;
    const labelWidthMM = getPrintLabelWidthMM();
    const baseWidthMM = activePrintLabelPhysicalWidth && activePrintLabelPhysicalWidth > 0 
      ? activePrintLabelPhysicalWidth 
      : 80;
    const scaleFactor = labelWidthMM / baseWidthMM;
    const finalScale = scale * scaleFactor;
    return (baseWidthMM * 0.375) * finalScale;
  };

  const handleDirectDownload = async () => {
    if (!activePrintBatch) return;
    setIsDownloading(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("ahnara_token") : "";
      
      const widthParam = layoutWidth === "custom" 
        ? `${customWidth}${customWidthUnit}` 
        : layoutWidth;

      const columnsParam = getSelectedColumns();
      const messageParam = encodeURIComponent(printMessage);

      // Build url
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const cleanBaseUrl = baseUrl.replace(/\/$/, "");
      const apiUrl = cleanBaseUrl.endsWith("/api") ? cleanBaseUrl : `${cleanBaseUrl}/api`;
      
      const response = await fetch(
        `${apiUrl}/producer/batches/${activePrintBatch.id}/print?width=${widthParam}&columns=${columnsParam}&message=${messageParam}&format=${fileFormat}&download=true`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to download layout: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Determine file extension
      let fileExt = "pdf";
      if (fileFormat === "png") fileExt = "png";
      else if (fileFormat === "tiff") fileExt = "tiff";

      // Trigger browser download
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `antifake-print-${activePrintBatch.batch_code}.${fileExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

    } catch (err: any) {
      alert(err.message || "Failed to download print layout.");
    } finally {
      setIsDownloading(false);
    }
  };

  const [generationProgress, setGenerationProgress] = useState(0);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [tokensList, setTokensList] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codeQuantity && selectedProduct) {
      try {
        setIsSubmitting(true);
        const qty = parseInt(codeQuantity);
        
        const planTier = summary?.plan_tier?.toLowerCase() || "free";
        const allowedQRLimit = summary?.allowed_qr_limit > 0 ? summary.allowed_qr_limit : (planTier === "starter" ? 25000 : planTier === "growth" ? 250000 : planTier === "enterprise" ? 1000000000 : 0);
        const codesCount = summary?.codes_count || 0;
        const remaining = Math.max(allowedQRLimit - codesCount, 0);

        if (planTier !== "enterprise" && qty > remaining) {
          alert(`Failed to create batch: the quantity of ${qty} codes exceeds your remaining allowed limit of ${remaining} codes.`);
          setIsSubmitting(false);
          return;
        }

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
          qr_position: `${qrX};${qrY};${qrScale}`,
          status: "active"
        });
        
        // Auto-generate tokens
        await api.post(`/producer/batches/${createdBatch.id}/generate`, {});
        
        // Reload batches
        const data = await api.get("/producer/batches");
        setBatches(data || []);

        // Reload summary metrics
        const summaryData = await api.get("/analytics/summary").catch(() => null);
        if (summaryData) {
          setSummary(summaryData);
        }
        
        setBatchId("");
        setCodeQuantity("1000");
        setManufactureDate(getTodayString());
        setExpiryDate(getTwoYearsString());
        setLabelImage("");
        setLabelRotation(0);
        setQrX(80);
        setQrY(80);
        setQrScale(100);
        setIsCreateModalOpen(false);
      } catch (err: any) {
        alert(err.message || "Failed to create batch.");
      } finally {
        setIsSubmitting(false);
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
                    <td className="p-4 font-mono font-bold text-slate-800 flex items-center gap-2">
                      {b.batch_code}
                      {b.label_image_url && (
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[9px] font-black uppercase tracking-wider">
                          Custom Label
                        </span>
                      )}
                    </td>
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
                        {b.label_image_url && (
                          <button 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 font-bold text-[10px] uppercase"
                            onClick={() => handleEditLabelClick(b)}
                          >
                            <IconEdit className="w-3.5 h-3.5" />
                            Edit Label
                          </button>
                        )}
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
              className="w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200/80 rounded-[32px] p-6 shadow-2xl relative z-10 text-left flex flex-col gap-5 overflow-hidden"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
                <h3 className="text-lg font-black text-slate-800 text-display">Issue Serial Codes</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateBatch} className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 max-h-[50vh] scrollbar-thin">
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
                  <p className="text-[10px] text-slate-500 mt-1.5 font-bold">
                    Remaining QR Generation Credits:{" "}
                    <span className="text-[#0089C1] font-black">
                      {summary?.plan_tier?.toLowerCase() === "enterprise"
                        ? "Unlimited"
                        : `${(Math.max((summary?.allowed_qr_limit > 0 ? summary.allowed_qr_limit : (summary?.plan_tier?.toLowerCase() === "starter" ? 25000 : summary?.plan_tier?.toLowerCase() === "growth" ? 250000 : 0)) - (summary?.codes_count || 0), 0)).toLocaleString()} codes`}
                    </span>
                  </p>
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
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-white flex items-center justify-center">
                            <img
                              src={labelImage}
                              alt="Label Preview"
                              style={{ transform: `rotate(${labelRotation}deg)` }}
                              className="w-full h-full object-contain transition-transform duration-200"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {labelImage && (
                      <div className="text-[9px] text-slate-500 break-all select-all font-mono bg-white p-2 rounded-lg border border-slate-200/60 mt-1">
                        <strong>Uploaded URL:</strong> {labelImage}
                      </div>
                    )}

                    {labelImage && (
                      <div className="flex flex-col gap-1.5 mt-2 bg-white p-3 rounded-xl border border-slate-200/60">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Graphic Dimensions</span>
                          <select
                            value={dimensionUnit}
                            onChange={(e) => setDimensionUnit(e.target.value as any)}
                            className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-[#0089C1]"
                          >
                            <option value="px">Pixels (px)</option>
                            <option value="mm">Millimeters (mm)</option>
                            <option value="cm">Centimeters (cm)</option>
                            <option value="in">Inches (in)</option>
                            <option value="ft">Feet (ft)</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-mono font-extrabold text-slate-800">
                            {formatDimensions(labelDimensions, labelPhysicalWidth, dimensionUnit)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold italic">
                            {dimensionUnit !== "px" && labelPhysicalWidth && labelPhysicalWidth > 0 && "(inherent physical print size detected from file)"}
                            {dimensionUnit !== "px" && (!labelPhysicalWidth || labelPhysicalWidth <= 0) && "(calculated print size at standard 80mm base width)"}
                            {dimensionUnit === "px" && "(original uploaded image resolution)"}
                          </span>
                        </div>
                      </div>
                    )}

                    {isUploadingLabel && <div className="text-[10px] text-slate-500 italic mt-1">Uploading label graphic...</div>}

                    {labelImage && (
                      <div className="mt-2 border-t border-slate-200/50 pt-2">
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
                      </div>
                    )}

                    {/* Live Preview Card */}
                    {labelImage && (
                      <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-200/50">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Live Label Layout Preview</label>
                        
                        <div className="flex justify-center p-2">
                          <div className="relative inline-block bg-slate-50">
                            {/* Background Graphic */}
                            <img
                              src={labelImage}
                              alt="Label Background"
                              style={{
                                transform: `rotate(${labelRotation}deg)`,
                                transformOrigin: "center"
                              }}
                              className="max-h-[220px] w-auto object-contain transition-all duration-100 block"
                            />

                            {/* Embedded Original QR Label Card */}
                            <div 
                              style={{
                                width: `${90 * (qrScale / 100)}%`,
                                position: "absolute",
                                left: `${qrX}%`,
                                top: `${qrY}%`,
                                transform: `translate(-${qrX}%, -${qrY}%)`
                              }}
                              className="bg-white/95 border border-slate-200/50 rounded-none shadow-md flex items-center select-none aspect-[72/34] @container"
                            >
                              {/* Left: QR Icon */}
                              <div 
                                className="w-[41.67%] aspect-square flex items-center justify-center bg-slate-50 border border-slate-100 rounded-md shrink-0 ml-[2.77%]"
                              >
                                <svg viewBox="0 0 24 24" className="w-full h-full text-slate-800 p-0.5" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="3" width="7" height="7" />
                                  <rect x="14" y="3" width="7" height="7" />
                                  <rect x="3" y="14" width="7" height="7" />
                                  <rect x="14" y="14" width="7" height="7" />
                                </svg>
                              </div>
                              {/* Right: Metadata */}
                              <div 
                                className="flex-1 h-full flex flex-col justify-between text-left min-w-0 pl-[4.16%] py-[2.77%] pr-[2.77%]"
                              >
                                <div>
                                  <div 
                                    className="font-black text-slate-500 tracking-wider uppercase leading-none text-[3.17cqw]"
                                  >
                                    SERIAL: <span className="font-mono text-slate-800 font-extrabold">B-XXXX</span>
                                  </div>
                                  <p 
                                    className="text-slate-600 font-medium line-clamp-3 leading-tight mt-[1%]"
                                    style={{ fontSize: '3.57cqw' }}
                                  >
                                    {printMessage || "Scan QR code or visit antifake.ng/verify..."}
                                  </p>
                                </div>
                                <div 
                                  className="flex items-center gap-[2%]"
                                >
                                  <div className="w-[7.64%] aspect-square bg-slate-300 rounded-full shrink-0" />
                                  <span className="font-black text-[#12213B] tracking-tight leading-none text-[3.97cqw]">AntiFakeNG</span>
                                </div>
                                <div 
                                  className="text-[#0089C1] font-black tracking-wider uppercase leading-none text-[2.38cqw]"
                                >
                                  SECURE VERIFICATION PORTAL
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                          
                        {/* Configuration Sliders */}
                        <div className="w-full flex flex-col gap-3 mt-2 pt-3 border-t border-slate-200/50">
                          {/* Top Row: QR Zoom */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase block">QR Code Zoom</label>
                              <span className="text-[9px] font-extrabold text-slate-700">{qrScale}%</span>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="150"
                              value={qrScale}
                              onChange={(e) => setQrScale(parseInt(e.target.value))}
                              className="w-full accent-[#0089C1] h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                          
                          {/* Bottom Row: X / Y Position Sliders */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase block">QR Position (X-Axis)</label>
                                <span className="text-[9px] font-extrabold text-slate-700">{qrX}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={qrX}
                                onChange={(e) => setQrX(parseInt(e.target.value))}
                                className="w-full accent-[#0089C1] h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                            
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase block">QR Position (Y-Axis)</label>
                                <span className="text-[9px] font-extrabold text-slate-700">{qrY}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={qrY}
                                onChange={(e) => setQrY(parseInt(e.target.value))}
                                className="w-full accent-[#0089C1] h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                </div>

                <div className="flex gap-3 mt-5 pt-3 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all font-bold py-3.5 rounded-full text-xs disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold py-3.5 rounded-full text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Creating Batch & Tokens..." : "Generate & Create Batch"}
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
                  <AhnaraLoader size="lg" />
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
                          <option value="png">High-Res PNG Roll</option>
                          <option value="tiff">High-Res TIFF Roll</option>
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

                    {/* Columns Layout mode and input */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Column Density Mode</label>
                        <select
                          value={columnsMode}
                          onChange={(e) => setColumnsMode(e.target.value as any)}
                          disabled={isGenerating}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0089C1] focus:bg-white disabled:opacity-60"
                        >
                          <option value="auto">Auto-Fit Columns (Preserve Label Size)</option>
                          <option value="manual">Manual Columns (Stretch/Shrink Label)</option>
                        </select>
                      </div>

                      {columnsMode === "manual" ? (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Columns Across Roll</label>
                          <select
                            value={manualColumns}
                            onChange={(e) => setManualColumns(parseInt(e.target.value))}
                            disabled={isGenerating}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0089C1] focus:bg-white disabled:opacity-60"
                          >
                            <option value="4">4 Columns</option>
                            <option value="6">6 Columns</option>
                            <option value="8">8 Columns</option>
                            <option value="10">10 Columns</option>
                            <option value="12">12 Columns</option>
                            <option value="14">14 Columns</option>
                            <option value="16">16 Columns</option>
                            <option value="18">18 Columns</option>
                            <option value="20">20 Columns</option>
                            <option value="24">24 Columns</option>
                          </select>
                        </div>
                      ) : (
                        <div className="flex flex-col justify-end pb-2">
                          <p className="text-[10px] text-slate-400 font-bold leading-normal">
                            * Dynamic columns automatically fit standard {(activePrintLabelPhysicalWidth || 80).toFixed(0)}mm labels across roll width.
                          </p>
                        </div>
                      )}
                    </div>

                    {columnsMode === "manual" && getPhysicalQrSizeMM() < 15 && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-[10px] font-bold leading-normal flex items-start gap-2 animate-fade-in">
                        <span>⚠️ WARNING: Calculated QR code width is very small ({(getPhysicalQrSizeMM()).toFixed(1)}mm). It might not scan reliably on thermal printers. Consider reducing column count.</span>
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
                        className="flex-1 bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold py-3.5 rounded-full text-xs shadow-md disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {isGenerating ? "Generating..." : "Generate & Preview"}
                      </button>
                    </div>
                  </div>

                  {/* Right Column - Live Visual Preview Workspace (5 Cols) */}
                  <div className="md:col-span-5 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Live Preview</h4>
                      <span className="text-[9px] font-extrabold text-[#0089C1] bg-white border border-slate-200/60 rounded-md px-2 py-0.5 shadow-xs">
                        {getSelectedColumns()} Columns
                      </span>
                    </div>
                    
                    {/* Live Label Item Rendering */}
                    {activePrintBatch?.label_image_url ? (
                      <div className="flex justify-center p-2 bg-white border border-slate-200 rounded-2xl overflow-hidden h-[135px] relative items-center">
                        <div className="relative inline-block max-h-full">
                          {/* Background Graphic */}
                          <img
                            src={activePrintBatch.label_image_url}
                            alt="Label Background"
                            style={{
                              transform: `rotate(${activePrintBatch.label_rotation || 0}deg)`,
                              transformOrigin: "center"
                            }}
                            className="max-h-[119px] w-auto object-contain transition-all duration-100 block"
                          />

                          {/* Embedded Original QR Label Card */}
                          {(() => {
                            const { x, y, qrScale } = parseQrPositionAndScales(activePrintBatch.qr_position);
                            const scale = qrScale / 100;
                            return (
                              <div 
                                style={{
                                  width: `${90 * scale}%`,
                                  position: "absolute",
                                  left: `${x}%`,
                                  top: `${y}%`,
                                  transform: `translate(-${x}%, -${y}%)`
                                }}
                                className="bg-white/95 border border-slate-200/50 rounded-none shadow-md flex items-center select-none aspect-[72/34] @container"
                              >
                                {/* Left: QR Icon */}
                                <div 
                                  className="w-[41.67%] aspect-square flex items-center justify-center bg-slate-50 border border-slate-100 rounded-md shrink-0 ml-[2.77%]"
                                >
                                  <svg viewBox="0 0 24 24" className="w-full h-full text-slate-800 p-0.5" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" />
                                    <rect x="14" y="3" width="7" height="7" />
                                    <rect x="3" y="14" width="7" height="7" />
                                    <rect x="14" y="14" width="7" height="7" />
                                  </svg>
                                </div>
                                {/* Right: Metadata */}
                                <div 
                                  className="flex-1 h-full flex flex-col justify-between text-left min-w-0 pl-[4.16%] py-[2.77%] pr-[2.77%]"
                                >
                                  <div>
                                    <div 
                                      className="font-black text-slate-500 tracking-wider uppercase leading-none text-[3.17cqw]"
                                    >
                                      SERIAL: <span className="font-mono text-slate-800 font-extrabold">B-XXXX</span>
                                    </div>
                                    <p 
                                      className="text-slate-600 font-medium line-clamp-3 leading-tight mt-[1%]"
                                      style={{ fontSize: '3.57cqw' }}
                                    >
                                      {printMessage || "Scan QR code..."}
                                    </p>
                                  </div>
                                  <div 
                                    className="flex items-center gap-[2%]"
                                  >
                                    <div className="w-[7.64%] aspect-square bg-slate-300 rounded-full shrink-0" />
                                    <span className="font-black text-[#12213B] tracking-tight leading-none text-[3.97cqw]">AntiFakeNG</span>
                                  </div>
                                  <div 
                                    className="text-[#0089C1] font-black tracking-wider uppercase leading-none text-[2.38cqw]"
                                  >
                                    SECURE VERIFICATION PORTAL
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
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
                    )}

                    {/* Industrial Roll Layout schematic */}
                    <div className="flex-1 flex flex-col gap-2 justify-center border border-dashed border-slate-200 rounded-xl p-4 bg-white/50">
                      <div className="flex flex-col gap-1 text-[10px] font-bold text-slate-400">
                        <div className="flex justify-between">
                          <span>Roll Width: {layoutWidth === "custom" ? `${customWidth} ${customWidthUnit}` : layoutWidth} ({getRollWidthMM().toFixed(1)} mm)</span>
                          <span>Label Graphic Width: {getPrintLabelWidthMM().toFixed(1)} mm</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200/50 pt-1 mt-1 text-slate-500">
                          <span>Columns: {columnsMode === "auto" ? "Roll Width / Label Width" : "Manually Selected"}</span>
                          <span className="font-extrabold text-[#0089C1]">{getSelectedColumns()} Columns</span>
                        </div>
                      </div>
                      
                      {/* Visual grid rendering */}
                      <div className="w-full h-24 bg-white border border-slate-200 rounded-md relative p-2 flex flex-col gap-1 overflow-hidden">
                        {[...Array(3)].map((_, r) => (
                          <div key={r} className="flex gap-1 justify-between">
                            {[...Array(Math.min(getSelectedColumns(), 20))].map((_, c) => (
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
                    Review generated layouts. Selected Roll Width: <span className="font-extrabold text-[#0089C1]">{layoutWidth === "custom" ? `${customWidth} ${customWidthUnit}` : layoutWidth === "4ft" ? "4ft (~1219mm)" : layoutWidth === "6ft" ? "6ft (~1828mm)" : "10ft (~3048mm)"} ({getRollWidthMM().toFixed(1)} mm)</span>
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
                        gridTemplateColumns: `repeat(${getSelectedColumns()}, ${getPrintLabelWidthMM()}mm)`,
                        width: "fit-content",
                        maxWidth: "100%",
                      }}
                    >
                      {tokensList.slice(0, 100).map((tokenObj, idx) => {
                        const prod = products.find(p => p.id === activePrintBatch?.product_id);
                        const productImage = prod?.image_url || "/logo.png";
                        const hasCustomLabel = !!activePrintBatch?.label_image_url;
                        const labelWidthMM = getPrintLabelWidthMM();

                        if (hasCustomLabel) {
                          const { x, y, qrScale } = parseQrPositionAndScales(activePrintBatch.qr_position);
                          const scale = qrScale / 100;
                          const baseWidthMM = activePrintLabelPhysicalWidth && activePrintLabelPhysicalWidth > 0 
                            ? activePrintLabelPhysicalWidth 
                            : 80;
                          const scaleFactor = labelWidthMM / baseWidthMM;
                          const finalScale = scale * scaleFactor;

                          return (
                            <div
                              key={idx}
                              style={{ width: `${labelWidthMM}mm` }}
                              className="relative inline-block select-none h-auto bg-white animate-fade-in"
                            >
                              {/* Background Image Layer */}
                              <img
                                src={activePrintBatch.label_image_url}
                                alt="Label Background"
                                style={{
                                  transform: `rotate(${activePrintBatch.label_rotation || 0}deg)`,
                                  transformOrigin: "center"
                                }}
                                className="w-full h-auto block pointer-events-none"
                              />

                                {/* Embedded Original QR Label Card */}
                                <div
                                  style={{
                                    width: `${(baseWidthMM * 0.90) * finalScale}mm`,
                                    height: `${(baseWidthMM * 0.425) * finalScale}mm`,
                                    padding: `${(baseWidthMM * 0.025) * finalScale}mm`,
                                    position: "absolute",
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    transform: `translate(-${x}%, -${y}%)`
                                  }}
                                  className="absolute bg-white/95 border border-slate-200/50 rounded-none shadow-sm flex items-center select-none"
                                >
                                {/* Left: QR Code */}
                                <div 
                                  style={{
                                    width: `${(baseWidthMM * 0.375) * finalScale}mm`,
                                    height: `${(baseWidthMM * 0.375) * finalScale}mm`,
                                    padding: `${(baseWidthMM * 0.025) * finalScale}px`
                                  }}
                                  className="flex items-center justify-center bg-slate-50 border border-slate-100 rounded-md shrink-0"
                                >
                                  <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(`https://antifake.ng/verify?token=${tokenObj.token}`)}`}
                                    alt="QR Code"
                                    className="w-full h-full object-contain"
                                  />
                                </div>

                                {/* Right: Metadata */}
                                <div 
                                  style={{ paddingLeft: `${(baseWidthMM * 0.0375) * finalScale}mm` }}
                                  className="flex-1 h-full flex flex-col justify-between text-left min-w-0"
                                >
                                  <div>
                                    <div 
                                      style={{ fontSize: `${(baseWidthMM * 0.125) * finalScale}px` }}
                                      className="font-black text-slate-500 tracking-wider uppercase leading-none"
                                    >
                                      SERIAL: <span className="font-mono text-slate-800 font-extrabold">{tokenObj.token}</span>
                                    </div>
                                    <p 
                                      style={{ fontSize: `${(baseWidthMM * 0.1375) * finalScale}px`, marginTop: `${(baseWidthMM * 0.0125) * finalScale}mm`, lineHeight: 1.1, paddingTop: `${(baseWidthMM * 0.00625) * finalScale}mm` }}
                                      className="text-slate-600 font-medium line-clamp-3"
                                    >
                                      {printMessage || "Scan QR code or visit antifake.ng/verify, input serial to check authenticity."}
                                    </p>
                                  </div>
                                  
                                  <div 
                                    style={{ gap: `${(baseWidthMM * 0.025) * finalScale}px`, padding: `${(baseWidthMM * 0.00625) * finalScale}mm 0` }}
                                    className="flex items-center"
                                  >
                                    <img src="/logo.png" alt="Logo" className="object-contain" style={{ width: `${(baseWidthMM * 0.06875) * finalScale}mm`, height: `${(baseWidthMM * 0.06875) * finalScale}mm` }} />
                                    <span style={{ fontSize: `${(baseWidthMM * 0.15) * finalScale}px` }} className="font-black text-[#12213B] tracking-tight leading-none">AntiFakeNG</span>
                                  </div>

                                  <div 
                                    style={{ fontSize: `${(baseWidthMM * 0.1) * finalScale}px` }}
                                    className="text-[#0089C1] font-black tracking-wider uppercase leading-none"
                                  >
                                    SECURE VERIFICATION PORTAL
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        const standardScale = labelWidthMM / 80;
                        return (
                          <div
                            key={idx}
                            style={{ width: `${labelWidthMM}mm`, height: `${40 * standardScale}mm` }}
                            className="border border-slate-200 rounded-lg flex overflow-hidden bg-white text-slate-800 shrink-0 select-none shadow-xs mx-auto"
                          >
                            {/* Left: QR Code */}
                            <div 
                              style={{
                                width: `${34 * standardScale}mm`,
                                height: `${34 * standardScale}mm`,
                                padding: `${2 * standardScale}mm`,
                                margin: `${3 * standardScale}mm`
                              }}
                              className="flex items-center justify-center bg-slate-50 border border-slate-100 rounded-md shrink-0"
                            >
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(`https://antifake.ng/verify?token=${tokenObj.token}`)}`}
                                alt="QR Code"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            {/* Right: Metadata */}
                            <div 
                              style={{ padding: `${3 * standardScale}mm`, paddingLeft: "0" }}
                              className="flex-1 flex flex-col justify-between text-left min-w-0"
                            >
                              <div>
                                <div 
                                  style={{ fontSize: `${10 * standardScale}px` }}
                                  className="font-black text-slate-500 tracking-wider uppercase leading-none"
                                >
                                  SERIAL: <span className="font-mono text-slate-800 font-extrabold">{tokenObj.token}</span>
                                </div>
                                <p 
                                  style={{ fontSize: `${11 * standardScale}px`, marginTop: `${1 * standardScale}mm`, lineHeight: 1.1 }}
                                  className="text-slate-600 font-medium line-clamp-3 font-ibm"
                                >
                                  {printMessage || "Scan QR code or visit antifake.ng/verify, input serial to check authenticity."}
                                </p>
                              </div>
                              <div 
                                style={{ gap: `${2 * standardScale}px`, padding: `${0.5 * standardScale}mm 0` }}
                                className="flex items-center"
                              >
                                <img src="/logo.png" alt="Logo" className="object-contain" style={{ width: `${5.5 * standardScale}mm`, height: `${5.5 * standardScale}mm` }} />
                                <span style={{ fontSize: `${12 * standardScale}px` }} className="font-black text-[#12213B] tracking-tight leading-none font-ibm">AntiFakeNG</span>
                              </div>
                              <div 
                                style={{ fontSize: `${8 * standardScale}px` }}
                                className="text-[#0089C1] font-black tracking-wider uppercase leading-none font-ibm"
                              >
                                SECURE VERIFICATION PORTAL
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {tokensList.length > 100 && (
                      <div className="bg-slate-200/60 border border-slate-300/40 rounded-xl p-3 text-center text-xs font-bold text-slate-600">
                        ⚠️ Preview is limited to the first 100 labels to preserve browser performance. All {tokensList.length} labels will be downloaded when you click "Download Layout File".
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
                    onClick={handleDirectDownload}
                    disabled={isDownloading}
                    className="bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold px-6 py-3 rounded-full text-xs shadow-md flex items-center gap-1.5 animate-bounce-subtle disabled:opacity-50"
                  >
                    <IconDownload className="w-4 h-4" />
                    {isDownloading ? "Downloading..." : "Download Layout File"}
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
            }
          `}} />
          <div
            className="grid gap-[1px] p-[1px]"
            style={{
              gridTemplateColumns: `repeat(${getSelectedColumns()}, ${getPrintLabelWidthMM()}mm)`,
              width: `${getRollWidthMM()}mm`,
            }}
          >
            {tokensList.map((tokenObj, idx) => {
              const prod = products.find(p => p.id === activePrintBatch?.product_id);
              const productImage = prod?.image_url || "/logo.png";
              const hasCustomLabel = !!activePrintBatch?.label_image_url;
              const labelWidthMM = getPrintLabelWidthMM();

              if (hasCustomLabel) {
                const { x, y, qrScale } = parseQrPositionAndScales(activePrintBatch.qr_position);
                const scale = qrScale / 100;
                const baseWidthMM = activePrintLabelPhysicalWidth && activePrintLabelPhysicalWidth > 0 
                  ? activePrintLabelPhysicalWidth 
                  : 80;
                const scaleFactor = labelWidthMM / baseWidthMM;
                const finalScale = scale * scaleFactor;

                return (
                  <div
                    key={idx}
                    style={{ width: `${labelWidthMM}mm` }}
                    className="print-card relative inline-block select-none h-auto bg-white"
                  >
                    {/* Background Image Layer */}
                    <img
                      src={activePrintBatch.label_image_url}
                      alt="Label Background"
                      style={{
                        transform: `rotate(${activePrintBatch.label_rotation || 0}deg)`,
                        transformOrigin: "center"
                      }}
                      className="w-full h-auto block pointer-events-none"
                    />

                      {/* Centered Embedded Original QR Label Card */}
                      <div
                        style={{
                        width: `${(baseWidthMM * 0.90) * finalScale}mm`,
                        height: `${(baseWidthMM * 0.425) * finalScale}mm`,
                        padding: `${(baseWidthMM * 0.025) * finalScale}mm`,
                        position: "absolute",
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: `translate(-${x}%, -${y}%)`
                      }}
                      className="absolute bg-white/95 border border-slate-200/50 rounded-none shadow-sm flex items-center select-none"
                    >
                      {/* Left: QR Code */}
                      <div 
                        style={{
                          width: `${(baseWidthMM * 0.375) * finalScale}mm`,
                          height: `${(baseWidthMM * 0.375) * finalScale}mm`,
                          padding: `${(baseWidthMM * 0.025) * finalScale}px`
                        }}
                        className="flex items-center justify-center bg-slate-50 border border-slate-100 rounded-md shrink-0"
                      >
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(`https://antifake.ng/verify?token=${tokenObj.token}`)}`}
                          alt="QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Right: Metadata */}
                      <div 
                        style={{ paddingLeft: `${(baseWidthMM * 0.0375) * finalScale}mm` }}
                        className="flex-1 h-full flex flex-col justify-between text-left min-w-0"
                      >
                        <div>
                          <div 
                            style={{ fontSize: `${(baseWidthMM * 0.125) * finalScale}px` }}
                            className="font-black text-slate-500 tracking-wider uppercase leading-none"
                          >
                            SERIAL: <span className="font-mono text-slate-800 font-extrabold">{tokenObj.token}</span>
                          </div>
                          <p 
                            style={{ fontSize: `${(baseWidthMM * 0.1375) * finalScale}px`, marginTop: `${(baseWidthMM * 0.0125) * finalScale}mm`, lineHeight: 1.1, paddingTop: `${(baseWidthMM * 0.00625) * finalScale}mm` }}
                            className="text-slate-600 font-medium line-clamp-3"
                          >
                            {printMessage || "Scan QR code or visit antifake.ng/verify, input serial to check authenticity."}
                          </p>
                        </div>
                        
                        <div 
                          style={{ gap: `${(baseWidthMM * 0.025) * finalScale}px`, padding: `${(baseWidthMM * 0.00625) * finalScale}mm 0` }}
                          className="flex items-center"
                        >
                          <img src="/logo.png" alt="Logo" className="object-contain" style={{ width: `${(baseWidthMM * 0.06875) * finalScale}mm`, height: `${(baseWidthMM * 0.06875) * finalScale}mm` }} />
                          <span style={{ fontSize: `${(baseWidthMM * 0.15) * finalScale}px` }} className="font-black text-[#12213B] tracking-tight leading-none">AntiFakeNG</span>
                        </div>

                        <div 
                          style={{ fontSize: `${(baseWidthMM * 0.1) * finalScale}px` }}
                          className="text-[#0089C1] font-black tracking-wider uppercase leading-none"
                        >
                          SECURE VERIFICATION PORTAL
                        </div>
                      </div>
                    </div>
                  </div>
                  );
              }

              const standardScale = labelWidthMM / 80;
              return (
                <div
                  key={idx}
                  style={{ width: `${labelWidthMM}mm`, height: `${40 * standardScale}mm` }}
                  className="print-card border border-slate-300 rounded-lg flex overflow-hidden bg-white text-slate-800 shrink-0 select-none"
                >
                  {/* Left: QR Code */}
                  <div 
                    style={{
                      width: `${34 * standardScale}mm`,
                      height: `${34 * standardScale}mm`,
                      padding: `${2 * standardScale}mm`,
                      margin: `${3 * standardScale}mm`
                    }}
                    className="flex items-center justify-center bg-white border border-slate-100 rounded-md shrink-0"
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(`https://antifake.ng/verify?token=${tokenObj.token}`)}`}
                      alt="QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* Right: Metadata */}
                  <div 
                    style={{ padding: `${3 * standardScale}mm`, paddingLeft: "0" }}
                    className="flex-1 flex flex-col justify-between text-left min-w-0"
                  >
                    <div>
                      <div 
                        style={{ fontSize: `${10 * standardScale}px` }}
                        className="font-black text-slate-500 tracking-wider uppercase leading-none"
                      >
                        SERIAL: <span className="font-mono text-slate-800 font-extrabold">{tokenObj.token}</span>
                      </div>
                      <p 
                        style={{ fontSize: `${11 * standardScale}px`, marginTop: `${1 * standardScale}mm`, lineHeight: 1.1 }}
                        className="text-slate-600 font-medium leading-tight mt-1"
                      >
                        {printMessage || "Scan QR code or visit antifake.ng/verify, input serial to check authenticity."}
                      </p>
                    </div>
                    <div 
                      style={{ gap: `${2 * standardScale}px`, padding: `${0.5 * standardScale}mm 0` }}
                      className="flex items-center"
                    >
                      <img src="/logo.png" alt="Logo" className="object-contain" style={{ width: `${5.5 * standardScale}mm`, height: `${5.5 * standardScale}mm` }} />
                      <span style={{ fontSize: `${12 * standardScale}px` }} className="font-black text-[#12213B] tracking-tight leading-none">AntiFakeNG</span>
                    </div>
                    <div 
                      style={{ fontSize: `${8 * standardScale}px` }}
                      className="text-[#0089C1] font-black tracking-wider uppercase leading-none"
                    >
                      SECURE VERIFICATION PORTAL
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}

      {/* Edit Label Modal */}
      <AnimatePresence>
        {isEditLabelModalOpen && editingBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditLabelModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl h-[95vh] max-h-[95vh] bg-white border border-slate-200/80 rounded-[32px] p-6 shadow-2xl relative z-10 text-left flex flex-col gap-5 overflow-hidden"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
                <div>
                  <h3 className="text-lg font-black text-slate-800 text-display">Edit Custom Label Layout</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Batch: <span className="font-mono font-black text-slate-600">{editingBatch.batch_code}</span>
                  </p>
                </div>
                <button
                  onClick={() => setIsEditLabelModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateLabelSubmit} className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 scrollbar-thin">
                  
                  {/* Upload Image Section */}
                  <div className="flex flex-col gap-2 bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Update Label Graphic</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditLabelUpload}
                          className="text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                        />
                      </div>
                      {editLabelImage && (
                        <button
                          type="button"
                          onClick={() => setEditLabelImage("")}
                          className="text-[9px] font-bold text-red-500 hover:text-red-700 border border-red-200 bg-red-50 px-2 py-1 rounded"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {isUploadingLabel && <div className="text-[10px] text-slate-500 italic mt-1">Uploading label graphic...</div>}
                  </div>

                  {editLabelImage && (
                    <>
                      {/* Dimension display and unit selector */}
                      <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Graphic Dimensions</span>
                          <select
                            value={dimensionUnit}
                            onChange={(e) => setDimensionUnit(e.target.value as any)}
                            className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-[#0089C1]"
                          >
                            <option value="px">Pixels (px)</option>
                            <option value="mm">Millimeters (mm)</option>
                            <option value="cm">Centimeters (cm)</option>
                            <option value="in">Inches (in)</option>
                            <option value="ft">Feet (ft)</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-mono font-extrabold text-slate-800">
                            {formatDimensions(editLabelDimensions, editLabelPhysicalWidth, dimensionUnit)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold italic">
                            {dimensionUnit !== "px" && editLabelPhysicalWidth && editLabelPhysicalWidth > 0 && "(inherent physical print size detected from file)"}
                            {dimensionUnit !== "px" && (!editLabelPhysicalWidth || editLabelPhysicalWidth <= 0) && "(calculated print size at standard 80mm base width)"}
                            {dimensionUnit === "px" && "(original uploaded image resolution)"}
                          </span>
                        </div>
                      </div>

                      {/* Configuration Controls */}
                      <div className="mt-2">
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Rotation</label>
                          <select
                            value={editLabelRotation}
                            onChange={(e) => setEditLabelRotation(parseInt(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0089C1] focus:bg-white"
                          >
                            <option value="0">0° (Normal)</option>
                            <option value="90">90° Right</option>
                            <option value="180">180° Upside Down</option>
                            <option value="270">270° Left</option>
                          </select>
                        </div>
                      </div>
                    {/* Live Preview Card */}
                      <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Live Label Layout Preview</label>
                        <div className="flex justify-center p-2">
                          <div className="relative inline-block bg-slate-50">
                            {/* Background Graphic */}
                            <img
                              src={editLabelImage}
                              alt="Label Background"
                              style={{
                                transform: `rotate(${editLabelRotation}deg)`,
                                transformOrigin: "center"
                              }}
                              className="max-h-[380px] w-auto object-contain transition-all duration-100 block"
                            />

                            {/* Centered Embedded Original QR Label Card */}
                             <div 
                               style={{
                                 width: `${90 * (editQrScale / 100)}%`,
                                 position: "absolute",
                                 left: `${editQrX}%`,
                                 top: `${editQrY}%`,
                                 transform: `translate(-${editQrX}%, -${editQrY}%)`
                               }}
                               className="absolute bg-white/95 border border-slate-200/50 rounded-none shadow-md flex items-center select-none animate-fade-in aspect-[72/34] @container"
                             >
                              {/* Left: QR Icon */}
                              <div 
                                className="w-[41.67%] aspect-square flex items-center justify-center bg-slate-50 border border-slate-100 rounded-md shrink-0 ml-[2.77%]"
                              >
                                <svg viewBox="0 0 24 24" className="w-full h-full text-slate-800 p-0.5" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="3" width="7" height="7" />
                                  <rect x="14" y="3" width="7" height="7" />
                                  <rect x="3" y="14" width="7" height="7" />
                                  <rect x="14" y="14" width="7" height="7" />
                                </svg>
                              </div>
                              {/* Right: Metadata */}
                              <div 
                                className="flex-1 h-full flex flex-col justify-between text-left min-w-0 pl-[4.16%] py-[2.77%] pr-[2.77%]"
                              >
                                <div>
                                  <div 
                                    className="font-black text-slate-500 tracking-wider uppercase leading-none text-[3.17cqw]"
                                  >
                                    SERIAL: <span className="font-mono text-slate-800 font-extrabold">B-XXXX</span>
                                  </div>
                                  <p 
                                    className="text-slate-600 font-medium line-clamp-3 leading-tight mt-[1%]"
                                    style={{ fontSize: '3.57cqw' }}
                                  >
                                    {printMessage || "Scan QR code or visit antifake.ng/verify..."}
                                  </p>
                                </div>
                                <div 
                                  className="flex items-center gap-[2%]"
                                >
                                  <div className="w-[7.64%] aspect-square bg-slate-300 rounded-full shrink-0" />
                                  <span className="font-black text-[#12213B] tracking-tight leading-none text-[3.97cqw]">AntiFakeNG</span>
                                </div>
                                <div 
                                  className="text-[#0089C1] font-black tracking-wider uppercase leading-none text-[2.38cqw]"
                                >
                                  SECURE VERIFICATION PORTAL
                                </div>
                              </div>
                             </div>
                          </div>
                        </div>
                          
                        {/* Configuration Sliders */}
                        <div className="w-full flex flex-col gap-3 mt-2 pt-3 border-t border-slate-200/50">
                          {/* Top Row: QR Zoom */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase block">QR Code Zoom</label>
                              <span className="text-[9px] font-extrabold text-slate-700">{editQrScale}%</span>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="150"
                              value={editQrScale}
                              onChange={(e) => setEditQrScale(parseInt(e.target.value))}
                              className="w-full accent-[#0089C1] h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                          
                          {/* Bottom Row: X / Y Position Sliders */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase block">QR Position (X-Axis)</label>
                                <span className="text-[9px] font-extrabold text-slate-700">{editQrX}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={editQrX}
                                onChange={(e) => setEditQrX(parseInt(e.target.value))}
                                className="w-full accent-[#0089C1] h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                            
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase block">QR Position (Y-Axis)</label>
                                <span className="text-[9px] font-extrabold text-slate-700">{editQrY}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={editQrY}
                                onChange={(e) => setEditQrY(parseInt(e.target.value))}
                                className="w-full accent-[#0089C1] h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                </div>

                <div className="flex gap-3 mt-5 pt-3 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditLabelModalOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all font-bold py-3.5 rounded-full text-xs disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold py-3.5 rounded-full text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Saving Layout..." : "Save Label Settings"}
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

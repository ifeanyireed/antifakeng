"use client";

import React, { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {
	IconCheck,
	IconShieldCheck,
	IconAlertTriangle,
	IconX,
	IconAlertCircle,
	IconReload,
	IconPhone,
	IconLock,
	IconMapPin,
	IconUpload,
	IconChevronRight
} from "@tabler/icons-react";
import { useLocation } from "@/components/ahnara/LocationContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function ConsumerVerifyClient({ params }: { params: Promise<{ token: string }> }) {
  const { currentCity, currentArea } = useLocation();
  const searchParams = useSearchParams();
  const unwrappedParams = use(params);
  
  let token = unwrappedParams.token;
  if ((!token || token === "fallback" || token === "[token]") && typeof window !== "undefined") {
    const pathParts = window.location.pathname.split("/");
    const verifyIdx = pathParts.indexOf("verify");
    if (verifyIdx !== -1 && pathParts[verifyIdx + 1]) {
      token = decodeURIComponent(pathParts[verifyIdx + 1]);
    }
  }
  if (!token) {
    token = "9F3C-71AE";
  }
  
  // Get simulated verdict from query parameters or default to genuine
  const initialVerdict = searchParams.get("v") || "genuine";

  const [step, setStep] = useState<"landing" | "phone" | "otp" | "verifying" | "verdict" | "report" | "report_success">("landing");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [verdict, setVerdict] = useState<string>(initialVerdict);
  const [otpError, setOtpError] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  interface ProductDetails {
    name: string;
    sku: string;
    category: string;
    description: string;
    image_url: string;
    brand_name: string;
  }

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [verificationData, setVerificationData] = useState<any>(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/verify/token/${token}`);
        if (res.ok) {
          const data = await res.json();
          if (data.verdict === "invalid") {
            setVerdict("invalid");
            setStep("verdict");
            setVerificationData(data);
          } else if (data.verdict === "recalled") {
            setVerdict("recalled");
            setStep("verdict");
            setVerificationData(data);
          } else {
            if (data.product) {
              setProduct({
                name: data.product.name,
                sku: data.product.sku,
                category: data.product.category,
                description: data.product.description,
                image_url: data.product.image_url || "/logo.png",
                brand_name: data.brand_name || "AntiFake Brand"
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to load product details from backend:", err);
      }
    };
    fetchProductDetails();
  }, [token]);
  
  // Form states for reporting
  const [retailerLocation, setRetailerLocation] = useState("");
  const [retailerName, setRetailerName] = useState("");
  const [reportComment, setReportComment] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Simulated verification logs
  const [verifyingLogStep, setVerifyingLogStep] = useState(0);
  const verifyingLogs = [
    "Checking cryptographic signature...",
    "Validating token uniqueness...",
    "Measuring scan velocity...",
    "Detecting device fingerprint collisions...",
    "Finalizing threat risk score..."
  ];

  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [sessionToken, setSessionToken] = useState("");
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (step === "verifying") {
      const interval = setInterval(() => {
        setVerifyingLogStep((prev) => {
          if (prev >= verifyingLogs.length - 1) {
            clearInterval(interval);
            
            // Execute real backend risk engine check
            const runCheck = async () => {
              try {
                // Dynamically compile the browser-detected geolocator coordinates details
                const geoTag = currentCity?.name && currentCity.slug
                  ? `${currentArea ? currentArea + ", " : ""}${currentCity.name}, NG`
                  : "NG";

                const res = await fetch(`${API_BASE}/api/verify/token/${token}/check`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    session_token: sessionToken,
                    device_id: "browser-client-uid-992",
                    ip_country: geoTag
                  })
                });
                if (res.ok) {
                  const data = await res.json();
                  setVerdict(data.verdict);
                  setVerificationData(data);
                }
              } catch (err) {
                console.error("Risk scan request error:", err);
              } finally {
                setStep("verdict");
              }
            };
            
            setTimeout(() => {
              runCheck();
            }, 800);
            return prev;
          }
          return prev + 1;
        });
      }, 700);
      return () => clearInterval(interval);
    }
  }, [step, sessionToken, token, currentCity, currentArea]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    if (phoneNumber.length >= 10) {
      try {
        const res = await fetch(`${API_BASE}/api/auth/otp/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            phone: "+234" + phoneNumber,
            channel
          })
        });
        if (res.ok) {
          setOtpSent(true);
          setStep("otp");
        } else {
          const data = await res.json();
          setApiError(data.error || "Failed to request code.");
        }
      } catch (err) {
        setApiError("Auth server is currently offline.");
      }
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          phone: "+234" + phoneNumber,
          code: otpCode
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSessionToken(data.session_token);
        setStep("verifying");
        setVerifyingLogStep(0);
      } else {
        setOtpError(true);
      }
    } catch (err) {
      setApiError("Authentication connection timeout.");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const uploadData = new FormData();
      uploadData.append("image", file);

      const res = await fetch(`${API_BASE}/api/producer/public/upload`, {
        method: "POST",
        body: uploadData
      });

      if (res.ok) {
        const data = await res.json();
        setPhotoUrl(data.url);
        alert("Photo uploaded successfully!");
      } else {
        throw new Error("Failed to upload image.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/analytics/reports/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          phone: phoneNumber,
          description: reportComment,
          retailer_name: retailerName,
          retailer_location: retailerLocation,
          photo_url: photoUrl
        })
      });
      if (res.ok) {
        setStep("report_success");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit report.");
      }
    } catch (err) {
      console.error("Report submit error:", err);
      alert("Analytics reporting service is offline.");
    }
  };

  // Reset verification simulator
  const handleReset = (newVerdict: string) => {
    setVerdict(newVerdict);
    setStep("landing");
    setPhoneNumber("");
    setOtpCode("");
    setOtpSent(false);
    setOtpError(false);
    setApiError("");
  };

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-slate-800 flex flex-col items-center justify-between p-4 font-sans select-none">
      
      {/* Dev Verdict Controls - Fixed Top Row for Easy Testing */}
      <div className="hidden w-full max-w-md bg-white border border-slate-200 shadow-sm rounded-2xl p-3 flex-col gap-2 z-30">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Dev Controls: Simulate Verdicts</span>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {["genuine", "previously_verified", "suspicious", "invalid", "recalled"].map((v) => (
            <button
              key={v}
              onClick={() => handleReset(v)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[9px] uppercase font-black transition-all ${
                verdict === v 
                  ? "bg-[#1E293B] text-white" 
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {v.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Main Form/Result Card */}
      <div className="w-full max-w-md flex-1 flex flex-col justify-center my-6">
        <div className="bg-white border border-slate-200/80 rounded-[32px] p-6 shadow-xl flex flex-col gap-6 relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            
            {/* STEP 1: LANDING */}
            {step === "landing" && (
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                    <IconShieldCheck className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight text-display">Secure QR Detected</h2>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    This unit holds an official digital identity. Complete a fast browser check to verify if it is genuine.
                  </p>
                </div>

                {/* Product Metadata Card */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                    <img 
                      src={product?.image_url || "/logo.png"} 
                      alt={product?.name || "Product image"} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/logo.png";
                      }}
                    />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {product?.brand_name || "Product Details"}
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 leading-tight truncate mt-0.5">
                      {product?.name || "AURA Skincare Serum"}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      SKU: {product?.sku || "AURA-SERUM-50ML"}
                    </p>
                    <span className="inline-block px-2 py-0.5 bg-slate-200 rounded font-mono text-[9px] font-bold text-slate-600 mt-1">
                      ID: {token}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setStep("phone")}
                  className="w-full bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold py-3.5 rounded-full text-xs shadow-md flex items-center justify-center gap-1.5"
                >
                  Verify Authenticity
                  <IconChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* STEP 2: PHONE INPUT */}
            {step === "phone" && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 bg-sky-50 text-[#0089C1] rounded-full flex items-center justify-center border border-sky-100">
                    <IconPhone className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight text-display">Secure Phone Binding</h2>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Enter your phone number. We'll send a one-time OTP to bind this scan to a real verification session. <strong className="text-slate-800 font-black">Please insist on adding your own number for accurate validation and loyalty rewards.</strong>
                  </p>
                </div>

                <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4 text-left">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Phone Number</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">+234</span>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="800 000 0000"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-14 pr-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0089C1] focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Channel Toggle */}
                  {(!verificationData?.brand_plan || verificationData?.brand_plan.toLowerCase() === "starter") ? (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Channel</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                        <button
                          type="button"
                          onClick={() => setChannel("whatsapp")}
                          className={`py-2 rounded-lg text-xs font-bold transition-all ${
                            channel === "whatsapp"
                              ? "bg-white text-slate-800 shadow-xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => setChannel("sms")}
                          className={`py-2 rounded-lg text-xs font-bold transition-all ${
                            channel === "sms"
                              ? "bg-white text-slate-800 shadow-xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          SMS Message
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Channel</label>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>WhatsApp Only</span>
                        <span className="text-[10px] text-emerald-600 font-extrabold uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 animate-pulse">Active</span>
                      </div>
                    </div>
                  )}

                  {apiError && (
                    <p className="text-[10px] text-red-500 font-bold leading-normal text-center">{apiError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold py-3.5 rounded-full text-xs shadow-md mt-2"
                  >
                    Request OTP Code
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 3: OTP CODE */}
            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 bg-sky-50 text-[#0089C1] rounded-full flex items-center justify-center border border-sky-100">
                    <IconLock className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight text-display">Enter Verification Code</h2>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Enter the 6-digit code sent to <span className="font-bold text-slate-700">+234 {phoneNumber}</span>. <br />
                    <span className="text-[10px] text-slate-400 font-bold">(Simulate with any 6-digit code)</span>
                  </p>
                </div>

                <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4 text-left">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">6-Digit OTP Code</label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => {
                        setOtpError(false);
                        setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                      }}
                      placeholder="000 000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-mono font-bold text-center tracking-widest text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#0089C1] focus:bg-white"
                      required
                    />
                    {otpError && (
                      <p className="text-[10px] text-red-500 font-bold mt-1">Invalid OTP code. Please enter 6 digits.</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold py-3.5 rounded-full text-xs shadow-md"
                  >
                    Confirm &amp; Run Risk Scan
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 4: VERIFYING LOADER */}
            {step === "verifying" && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-8 items-center text-center py-6"
              >
                <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-[#0089C1] animate-spin" />
                
                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight text-display">Running Security Engine</h2>
                  <p className="text-xs text-[#0089C1] font-bold font-mono uppercase tracking-wider animate-pulse">
                    {verifyingLogs[verifyingLogStep]}
                  </p>
                </div>

                {/* Progress Indicators */}
                <div className="w-full max-w-xs flex flex-col gap-2 bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-left">
                  {verifyingLogs.map((log, index) => (
                    <div key={log} className="flex items-center gap-2 text-[10px] font-bold">
                      {verifyingLogStep > index ? (
                        <IconCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      ) : verifyingLogStep === index ? (
                        <IconReload className="w-3.5 h-3.5 text-[#0089C1] animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-200 flex-shrink-0" />
                      )}
                      <span className={
                        verifyingLogStep > index ? "text-slate-700" : verifyingLogStep === index ? "text-[#0089C1]" : "text-slate-400"
                      }>
                        {log.replace("...", "")}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 5: VERDICTS */}
            {step === "verdict" && (
              <motion.div
                key="verdict"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                
                {/* GENUINE VERDICT */}
                {verdict === "genuine" && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                        <IconCheck className="w-8 h-8 stroke-[3]" />
                      </div>
                      <h2 className="text-2xl font-black text-emerald-600 tracking-tight text-display">Genuine Product</h2>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        Verification Successful. This product matches manufacturer catalog data and is certified authentic.
                      </p>
                    </div>

                    <div className="bg-[#E8F3CE]/45 border border-[#CDE0A4] rounded-2xl p-4 text-left text-xs flex flex-col gap-2">
                      <span className="text-[9px] font-black text-[#608216] uppercase tracking-widest">Authentication Certificate</span>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 font-medium text-slate-700 mt-1">
                        <div>
                           <span className="text-slate-400 text-[10px]">Product SKU</span>
                           <p className="font-bold text-slate-800 truncate">{verificationData?.product?.sku || product?.sku || "---"}</p>
                        </div>
                        <div>
                           <span className="text-slate-400 text-[10px]">Production Batch</span>
                           <p className="font-bold text-slate-800">{verificationData?.batch?.batch_code || "---"}</p>
                        </div>
                        <div>
                           <span className="text-slate-400 text-[10px]">Manufacture Date</span>
                           <p className="font-bold text-slate-800">
                             {verificationData?.batch?.manufacture_date 
                               ? new Date(verificationData.batch.manufacture_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) 
                               : "---"}
                           </p>
                        </div>
                        <div>
                           <span className="text-slate-400 text-[10px]">Expiry Date</span>
                           <p className="font-bold text-slate-800 font-mono">
                             {verificationData?.batch?.expiry_date 
                               ? new Date(verificationData.batch.expiry_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) 
                               : "---"}
                           </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PREVIOUSLY VERIFIED VERDICT */}
                {verdict === "previously_verified" && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="w-16 h-16 rounded-full bg-yellow-50 border border-yellow-100 text-yellow-600 flex items-center justify-center shadow-sm">
                        <IconAlertTriangle className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-black text-yellow-600 tracking-tight text-display">Previously Verified</h2>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        This token has already been validated. If you did not perform this scan yourself, this package may be cloned or copied.
                      </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200/50 rounded-2xl p-4 text-left text-xs flex flex-col gap-2">
                      <span className="text-[9px] font-black text-yellow-600 uppercase tracking-widest">Previous Scan Log</span>
                      <div className="grid grid-cols-1 gap-y-3 font-medium text-slate-700 mt-1">
                        <div className="flex gap-2 items-center">
                          <IconReload className="w-4 h-4 text-slate-400" />
                          <div>
                            <span className="text-slate-400 text-[10px] block">First Verified</span>
                            <p className="font-bold text-slate-800">July 04, 2026 at 12:42 PM</p>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <IconMapPin className="w-4 h-4 text-slate-400" />
                          <div>
                            <span className="text-slate-400 text-[10px] block">Scan Location</span>
                            <p className="font-bold text-slate-800">Ikeja, Lagos, Nigeria</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUSPICIOUS VERDICT */}
                {verdict === "suspicious" && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center shadow-sm">
                        <IconAlertTriangle className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-black text-orange-600 tracking-tight text-display">Suspicious Scan</h2>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        Warning: High-risk scan indicators detected. Multiple checks from different geographic coordinates occurred in a short period.
                      </p>
                    </div>

                    <div className="bg-orange-50 border border-orange-200/50 rounded-2xl p-4 text-left text-xs flex flex-col gap-2">
                      <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Threat Signals Flagged</span>
                      <ul className="list-disc pl-4 text-slate-600 flex flex-col gap-1 mt-1 font-semibold">
                        <li>Impossible Travel Velocity: Lagos &amp; Abuja scan detected in 10-minute window</li>
                        <li>Multiple distinct device fingerprints checked this serial number</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* INVALID VERDICT */}
                {verdict === "invalid" && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shadow-sm">
                        <IconX className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-black text-red-600 tracking-tight text-display">Invalid Product</h2>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        Failure: Unknown cryptographic serial number. This code does not match any batch released by the brand manufacturer.
                      </p>
                    </div>

                    <div className="bg-red-50 border border-red-200/50 rounded-2xl p-4 text-left text-xs flex flex-col gap-2">
                      <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Security Warning</span>
                      <p className="text-slate-600 font-semibold leading-relaxed">
                        Do not use or consume this product. Fakes or counterfeits are highly dangerous. Report this package to the brand instantly.
                      </p>
                    </div>
                  </div>
                )}

                {/* RECALLED VERDICT */}
                {verdict === "recalled" && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shadow-sm">
                        <IconAlertCircle className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-black text-slate-600 tracking-tight text-display">Batch Recalled</h2>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        Notice: This product is genuine but belongs to Batch <span className="font-bold text-slate-800">{verificationData?.batch?.batch_code || "---"}</span> which has been recalled by the manufacturer.
                      </p>
                    </div>

                    <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-left text-xs flex flex-col gap-2">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Reason for Recall</span>
                      <p className="text-slate-600 font-semibold leading-relaxed">
                        Voluntary recall issued due to minor packaging seal imperfections in batch production. Do not consume. Contact support for a free replacement.
                      </p>
                    </div>
                  </div>
                )}

                {/* Bottom Actions based on verdict */}
                <div className="flex flex-col gap-2.5 mt-2">
                  {(verdict === "suspicious" || verdict === "invalid" || verdict === "previously_verified") && (
                    <button
                      onClick={() => setStep("report")}
                      className="w-full bg-red-600 hover:bg-red-700 text-white transition-all font-bold py-3.5 rounded-full text-xs shadow-md"
                    >
                      Report Cloned/Fake Product
                    </button>
                  )}
                  <button
                    onClick={() => handleReset(verdict)}
                    className="w-full bg-[#E8EFF4] border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-bold py-3.5 rounded-full text-xs"
                  >
                    Run Scan Again
                  </button>
                </div>

              </motion.div>
            )}

            {/* STEP 6: REPORT PRODUCT FORM */}
            {step === "report" && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight text-display">File Fraud Report</h2>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Help us locate counterfeits. Provide information on where you purchased this product to alert brand protection.
                  </p>
                </div>

                <form onSubmit={handleReportSubmit} className="flex flex-col gap-4 text-left">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Retailer/Store Name</label>
                    <input
                      type="text"
                      value={retailerName}
                      onChange={(e) => setRetailerName(e.target.value)}
                      placeholder="e.g. Pharmacy A, Ikeja Mall"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0089C1] focus:bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Retailer Location (City/State)</label>
                    <input
                      type="text"
                      value={retailerLocation}
                      onChange={(e) => setRetailerLocation(e.target.value)}
                      placeholder="e.g. Ikeja, Lagos"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0089C1] focus:bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Comments/Details</label>
                    <textarea
                      value={reportComment}
                      onChange={(e) => setReportComment(e.target.value)}
                      placeholder="How much did it cost? Did packaging look tampered?"
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0089C1] focus:bg-white resize-none"
                    />
                  </div>

                  {/* Photo upload input */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      Product Photos (Optional)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 hover:border-[#0089C1] rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-slate-500 hover:text-[#0089C1] transition-all bg-slate-50">
                      <IconUpload className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {isUploadingPhoto 
                          ? "Uploading..." 
                          : photoUrl 
                          ? "Change Photo" 
                          : "Upload Product Photos"}
                      </span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                        disabled={isUploadingPhoto}
                      />
                    </label>
                    {photoUrl && (
                      <div className="mt-2 text-center">
                        <img 
                          src={photoUrl} 
                          alt="Uploaded counterfeit preview" 
                          className="max-h-24 rounded-lg object-contain mx-auto border border-slate-200 p-1" 
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setStep("verdict")}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all font-bold py-3 rounded-full text-xs"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white transition-all font-bold py-3 rounded-full text-xs shadow-md shadow-red-600/10"
                    >
                      Submit Report
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 7: REPORT SUCCESS */}
            {step === "report_success" && (
              <motion.div
                key="report_success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6 items-center text-center py-6"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                  <IconCheck className="w-8 h-8 stroke-[3]" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight text-display">Report Submitted</h2>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Thank you. Your report has been securely registered. Brand protection intelligence teams will investigate this retail point immediately.
                  </p>
                </div>

                <button
                  onClick={() => handleReset("genuine")}
                  className="w-full bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold py-3.5 rounded-full text-xs shadow-md mt-4"
                >
                  Done
                </button>
              </motion.div>
            )}

          </AnimatePresence>
          
        </div>
      </div>

      {/* Footer copyright */}
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
        © 2026 AntiFakeNG. Secure Verification Portal.
      </span>
      
    </div>
  );
}

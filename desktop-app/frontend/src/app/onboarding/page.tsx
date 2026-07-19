"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  IconBuildingStore, 
  IconQrcode, 
  IconCheck, 
  IconLock,
  IconShieldCheck,
  IconAlertTriangle,
  IconSparkles,
  IconArrowRight,
  IconArrowLeft,
  IconKey,
  IconCamera,
  IconPhoto,
  IconFileText
} from "@tabler/icons-react";
import { AhnaraCard } from "@/components/ahnara/AhnaraCard";
import { AhnaraButton } from "@/components/ahnara/AhnaraButton";
import { AhnaraInput } from "@/components/ahnara/AhnaraInput";
import { AhnaraLoader } from "@/components/ahnara/AhnaraLoader";
import { useAuth } from "@/components/ahnara/AuthContext";
import { api } from "@/lib/api";
import dynamic from "next/dynamic";

const PaystackButton = dynamic(
  () => import("@/components/ahnara/PaystackButton"),
  { ssr: false }
);

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);
  
  // Step 1: Brand Info state
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("Cosmetics");
  const [website, setWebsite] = useState("");
  const [hqAddress, setHqAddress] = useState("");

  // Step 2: KYC Compliance state
  const [idCardUrl, setIdCardUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [utilityBillUrl, setUtilityBillUrl] = useState("");

  const [uploadingIdCard, setUploadingIdCard] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [uploadingUtilityBill, setUploadingUtilityBill] = useState(false);
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);
  const [isCompletingSetup, setIsCompletingSetup] = useState(false);

  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      setCameraActive(true);
      // Access camera stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Could not access camera. Please upload a pre-taken selfie instead.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    context.drawImage(videoRef.current, 0, 0, 320, 240);
    stopCamera();

    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      await uploadKycFile(file, "selfie");
    }, "image/jpeg");
  };

  const uploadKycFile = async (file: File, type: "id_card" | "selfie" | "utility_bill") => {
    const formData = new FormData();
    formData.append("image", file);

    if (type === "id_card") setUploadingIdCard(true);
    if (type === "selfie") setUploadingSelfie(true);
    if (type === "utility_bill") setUploadingUtilityBill(true);

    try {
      const data = await api.upload("/producer/upload", formData);
      if (type === "id_card") setIdCardUrl(data.url);
      if (type === "selfie") setSelfieUrl(data.url);
      if (type === "utility_bill") setUtilityBillUrl(data.url);
    } catch (err: any) {
      console.error("Upload error:", err);
      alert(err.message || "File upload failed.");
    } finally {
      if (type === "id_card") setUploadingIdCard(false);
      if (type === "selfie") setUploadingSelfie(false);
      if (type === "utility_bill") setUploadingUtilityBill(false);
    }
  };
  
  // Step 2: Plan Selection state
  const [selectedPlan, setSelectedPlan] = useState("Growth");

  // Step 3: API Key state
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isGenerated, setIsGenerated] = useState(false);

  // Fetch brand details and skip to step 3 if KYC is already uploaded
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await api.get("/producer/profile");
        if (profile) {
          if (profile.name) setBrandName(profile.name);
          if (profile.id_card_url) setIdCardUrl(profile.id_card_url);
          if (profile.selfie_url) setSelfieUrl(profile.selfie_url);
          if (profile.utility_bill_url) setUtilityBillUrl(profile.utility_bill_url);
          
          if (profile.status === "kyc_approved" || (profile.id_card_url && profile.selfie_url && profile.utility_bill_url)) {
            setCurrentStep(3);
          }
        }
      } catch (err) {
        console.error("Failed to load existing profile:", err);
      }
    };
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const generateCredentials = () => {
    setIsGenerated(true);
    setApiKey("ak_live_onb_" + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10));
    setApiSecret("sk_live_onb_" + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12));
  };

  const handleNext = () => {
    if (currentStep === 1 && !brandName) {
      alert("Please enter your brand name to continue.");
      return;
    }
    if (currentStep === 2 && (!idCardUrl || !selfieUrl || !utilityBillUrl)) {
      alert("Please upload NIN/License, captured Selfie, and Utility Bill to proceed.");
      return;
    }
    if (currentStep === 3 && !selectedPlan) {
      alert("Please select a subscription level.");
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmitKyc = async () => {
    if (!idCardUrl || !selfieUrl || !utilityBillUrl) {
      alert("Please upload NIN/License, captured Selfie, and Utility Bill to proceed.");
      return;
    }
    setIsSubmittingKyc(true);
    try {
      await api.put("/producer/profile", {
        name: brandName,
        contact_email: user?.email || "admin@brand.com",
        brand_logo_url: "/logo.png",
        plan_tier: "growth",
        id_card_url: idCardUrl,
        selfie_url: selfieUrl,
        utility_bill_url: utilityBillUrl,
        status: "pending_approval"
      });

      alert("KYC documents submitted successfully! Your account is now under review. You will be redirected to the login page.");
      logout();
    } catch (err: any) {
      console.error("KYC submission error:", err);
      alert(err.message || "Failed to submit KYC.");
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  const handleComplete = async () => {
    setIsCompletingSetup(true);
    try {
      const isEnterprise = selectedPlan.toLowerCase() === "enterprise";
      await api.put("/producer/profile", {
        name: brandName,
        contact_email: user?.email || "admin@brand.com",
        brand_logo_url: "/logo.png",
        plan_tier: selectedPlan.toLowerCase(),
        id_card_url: idCardUrl,
        selfie_url: selfieUrl,
        utility_bill_url: utilityBillUrl,
        api_key: apiKey,
        api_secret: apiSecret,
        status: isEnterprise ? "pending_approval" : "active"
      });

      const onboardingData = {
        brandName,
        industry,
        website,
        hqAddress,
        selectedPlan,
        apiKey,
        apiSecret,
        idCardUrl,
        selfieUrl,
        utilityBillUrl,
        setupCompleted: true,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem("producer_brand_data", JSON.stringify(onboardingData));

      if (isEnterprise) {
        alert("Enterprise plan activation request submitted successfully! Your account is now under review. You will be redirected to the login page.");
        logout();
      } else {
        router.push("/producer/dashboard");
      }
    } catch (err: any) {
      console.error("Onboarding submit error:", err);
      alert(err.message || "Failed to save onboarding details.");
    } finally {
      setIsCompletingSetup(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E8EFF4] flex items-center justify-center">
        <AhnaraLoader label="Authenticating session..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col items-center justify-center p-4 md:p-8">
      {/* Container Card */}
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden flex flex-col transition-all duration-300">
        
        {/* Header Branding */}
        <div className="px-6 pt-8 pb-4 text-center border-b border-slate-100 bg-[#E8F3CE]/20 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#D4F475] flex items-center justify-center mb-3 shadow-md">
            <img src="/logo.png" alt="AntiFakeNG Logo" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#0D090C] text-display">AntiFakeNG Onboarding</h1>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Secure Brand Setup Wizard</p>
        </div>

        {/* Multi-step progress indicator */}
        <div className="px-8 pt-6 flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <React.Fragment key={step}>
              <div className="flex items-center gap-2.5">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    currentStep === step 
                      ? "bg-[#1E293B] text-white ring-4 ring-slate-200"
                      : currentStep > step 
                      ? "bg-[#8BB436] text-white"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {currentStep > step ? <IconCheck className="w-4 h-4" /> : step}
                </div>
                <span className={`text-xs font-bold hidden sm:inline ${
                  currentStep === step ? "text-[#0D090C]" : "text-slate-400"
                }`}>
                  {step === 1 && "Profile"}
                  {step === 2 && "KYC Verification"}
                  {step === 3 && "License Plan"}
                  {step === 4 && "Credentials"}
                </span>
              </div>
              {step < 4 && (
                <div className={`flex-1 h-0.5 mx-4 rounded-full transition-all duration-300 ${
                  currentStep > step ? "bg-[#8BB436]" : "bg-slate-100"
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-6 md:p-8 flex-1">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: CORPORATE PROFILE */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-5"
              >
                <div className="text-left">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight text-display">Register Brand Profile</h2>
                  <p className="text-sm text-slate-500 font-semibold mt-1">
                    Provide your manufacturer metadata details to register your namespace in the multi-tenant registry.
                  </p>
                </div>

                <div className="flex flex-col gap-4 text-left">
                  <AhnaraInput
                    label="Brand Name"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Aura Labs Inc"
                    required
                  />

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Industry / Sector
                    </label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full bg-[#F1F5F9]/50 border border-slate-200 rounded-2xl py-3 px-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all font-semibold text-slate-800"
                    >
                      <option value="Cosmetics">Cosmetics &amp; Skincare</option>
                      <option value="Pharma">Pharmaceuticals &amp; Meds</option>
                      <option value="Consumer Goods">FMCG &amp; Consumer Goods</option>
                      <option value="Chemicals">Industrial Chemicals</option>
                    </select>
                  </div>

                  <AhnaraInput
                    label="Corporate Website URL"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="e.g. auralabs.com"
                  />

                  <AhnaraInput
                    label="Corporate Headquarters Address"
                    value={hqAddress}
                    onChange={(e) => setHqAddress(e.target.value)}
                    placeholder="e.g. Lagos, Nigeria"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: KYC COMPLIANCE DOCUMENTS */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-5 text-left"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight text-display font-sans">Identity & Address Verification (KYC)</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    To comply with security and counterfeit regulations, upload your government ID, take a live verification selfie, and provide a recent utility bill.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Document 1: NIN / Driving License */}
                  <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconPhoto className="w-5 h-5 text-[#0089C1]" />
                        <span className="text-xs font-bold text-slate-800">NIN Card / Driving License</span>
                      </div>
                      {idCardUrl && <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">Uploaded</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Upload a scanned copy of your national identity card or driver's license.</p>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadKycFile(file, "id_card");
                      }}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                    />
                    {uploadingIdCard && <p className="text-[10px] text-slate-400 italic animate-pulse">Uploading document...</p>}
                    {idCardUrl && <p className="text-[10px] text-emerald-600 font-semibold">✓ Document uploaded successfully.</p>}
                  </div>

                  {/* Document 2: Camera Selfie Capture */}
                  <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconCamera className="w-5 h-5 text-[#0089C1]" />
                        <span className="text-xs font-bold text-slate-800">Verification Selfie Photo</span>
                      </div>
                      {selfieUrl && <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">Captured</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Use your device webcam to capture a live photo of yourself for representative validation.</p>
                    
                    {cameraActive ? (
                      <div className="flex flex-col items-center gap-2 border border-slate-200 bg-black rounded-xl overflow-hidden p-2">
                        <video ref={videoRef} autoPlay playsInline className="w-[240px] h-[180px] bg-slate-900 rounded-lg object-cover" />
                        <div className="flex gap-2">
                          <button 
                            type="button" 
                            onClick={capturePhoto}
                            className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold py-1.5 px-4 rounded-lg text-[10px] transition-colors"
                          >
                            Capture Photo
                          </button>
                          <button 
                            type="button" 
                            onClick={stopCamera}
                            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-1.5 px-4 rounded-lg text-[10px] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3 items-center">
                        <button 
                          type="button" 
                          onClick={startCamera}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1.5 px-4 rounded-xl text-xs transition-colors"
                        >
                          Start Camera
                        </button>
                        <span className="text-[10px] text-slate-400 font-semibold">Or upload pre-taken:</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadKycFile(file, "selfie");
                          }}
                          className="text-xs text-slate-500 file:mr-3 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                        />
                      </div>
                    )}
                    <canvas ref={canvasRef} width="320" height="240" className="hidden" />
                    {uploadingSelfie && <p className="text-[10px] text-slate-400 italic animate-pulse">Uploading selfie...</p>}
                    {selfieUrl && (
                      <div className="flex items-center gap-3">
                        <img src={selfieUrl} alt="Captured Selfie Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                        <span className="text-[10px] text-emerald-600 font-semibold">✓ Verification Selfie captured successfully.</span>
                      </div>
                    )}
                  </div>

                  {/* Document 3: Utility Bill */}
                  <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconFileText className="w-5 h-5 text-[#0089C1]" />
                        <span className="text-xs font-bold text-slate-800">Utility Bill (Proof of Address)</span>
                      </div>
                      {utilityBillUrl && <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">Uploaded</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Upload a recent utility bill (electricity, water, waste) matching your corporate headquarters address.</p>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadKycFile(file, "utility_bill");
                      }}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                    />
                    {uploadingUtilityBill && <p className="text-[10px] text-slate-400 italic animate-pulse">Uploading utility bill...</p>}
                    {utilityBillUrl && <p className="text-[10px] text-emerald-600 font-semibold">✓ Utility Bill uploaded successfully.</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PLAN SELECTION */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-5"
              >
                <div className="text-left">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight text-display">Select Issuance Volume</h2>
                  <p className="text-sm text-slate-500 font-semibold mt-1">
                    Select a license level suited to your manufacturing output.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  {/* Starter Plan */}
                  <div 
                    onClick={() => setSelectedPlan("Starter")}
                    className={`border-2 rounded-2xl p-5 cursor-pointer flex flex-col gap-3 transition-all ${
                      selectedPlan === "Starter"
                        ? "border-[#1E293B] bg-slate-50/50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Starter</span>
                    <div>
                      <h4 className="text-lg font-black text-slate-800">25,000</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Codes issued / month</p>
                    </div>
                    <ul className="text-[10px] text-slate-500 flex flex-col gap-1 mt-2 font-medium border-t border-slate-100 pt-3">
                      <li>✓ Single Brand</li>
                      <li>✓ Core Analytics</li>
                      <li className="font-bold text-[#608216] mt-1">₦150,000/mo</li>
                    </ul>
                  </div>

                  {/* Growth Plan */}
                  <div 
                    onClick={() => setSelectedPlan("Growth")}
                    className={`border-2 rounded-2xl p-5 cursor-pointer flex flex-col gap-3 transition-all ${
                      selectedPlan === "Growth"
                        ? "border-[#1E293B] bg-slate-50/50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Growth</span>
                    <div>
                      <h4 className="text-lg font-black text-slate-800">250,000</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Codes issued / month</p>
                    </div>
                    <ul className="text-[10px] text-slate-500 flex flex-col gap-1 mt-2 font-medium border-t border-slate-100 pt-3">
                      <li>✓ Multi-brand catalog</li>
                      <li>✓ Regional map intel</li>
                      <li className="font-bold text-[#608216] mt-1">₦450,000/mo</li>
                    </ul>
                  </div>

                  {/* Enterprise Plan */}
                  <div 
                    onClick={() => setSelectedPlan("Enterprise")}
                    className={`border-2 rounded-2xl p-5 cursor-pointer flex flex-col gap-3 transition-all ${
                      selectedPlan === "Enterprise"
                        ? "border-[#1E293B] bg-slate-50/50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Enterprise</span>
                    <div>
                      <h4 className="text-lg font-black text-slate-800">Unlimited</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Codes issued / month</p>
                    </div>
                    <ul className="text-[10px] text-slate-500 flex flex-col gap-1 mt-2 font-medium border-t border-slate-100 pt-3">
                      <li>✓ Custom limits</li>
                      <li>✓ Platform-wide API</li>
                      <li className="font-bold text-[#608216] mt-1">Custom Pricing</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: API CREDENTIALS */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-5"
              >
                <div className="text-left">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight text-display">Secure API Provisioning</h2>
                  <p className="text-sm text-slate-500 font-semibold mt-1">
                    Generate cryptographic keys to integrate AntiFakeNG with your ERP, printing conveyor lines, or labeling machinery.
                  </p>
                </div>

                {!isGenerated ? (
                  <div className="py-6 flex flex-col items-center gap-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <IconKey className="w-10 h-10 text-slate-400" />
                    <div className="text-center px-6">
                      <h4 className="text-xs font-bold text-slate-800">Credentials Pending Generation</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                        Click the button below to mint your unique production API credentials and private client key.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={generateCredentials}
                      className="bg-[#1E293B] text-white hover:bg-slate-800 py-2.5 px-6 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      Provision API Keys
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 text-left animate-fade-in">
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <IconShieldCheck className="w-4 h-4" />
                      </div>
                      <p className="text-[10px] text-emerald-700 font-bold leading-relaxed">
                        API keys provisioned successfully. Copy and store these keys securely. Private secret keys will not be displayed again.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 font-semibold text-slate-600 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Client API ID</span>
                        <input
                          type="text"
                          value={apiKey}
                          readOnly
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-800 mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Private Client Secret</span>
                        <input
                          type="text"
                          value={apiSecret}
                          readOnly
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-800 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-4">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold px-6 py-2.5 rounded-full text-xs transition-all flex items-center gap-1.5"
            >
              <IconArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {currentStep === 3 ? (
            selectedPlan === "Enterprise" ? (
              <button
                onClick={() => {
                  alert("Enterprise Custom contract activation requested. A representative will contact your billing department. Activating platform trial access...");
                  setCurrentStep(4);
                }}
                className="bg-[#1E293B] text-white hover:bg-slate-800 font-bold px-6 py-2.5 rounded-full text-xs shadow-md transition-all"
              >
                Contact Sales & Activate Trial
              </button>
            ) : (
              <PaystackButton
                config={{
                  reference: "pay_" + Math.random().toString(36).substring(2, 12),
                  email: "billing@brand.com",
                  amount: selectedPlan === "Starter" ? 15000000 : 45000000,
                  publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
                }}
                onSuccess={(ref) => {
                  alert(`Payment Confirmed. Tx Ref: ${ref.reference}. Activating plan...`);
                  setCurrentStep(4);
                }}
                onClose={() => {
                  alert("Checkout flow terminated by user.");
                }}
                text={`Pay & Activate ${selectedPlan}`}
                className="bg-[#1E293B] text-white hover:bg-slate-800 font-bold px-6 py-2.5 rounded-full text-xs shadow-md"
              />
            )
          ) : currentStep === 2 ? (
            <button
              onClick={handleSubmitKyc}
              disabled={isSubmittingKyc}
              className="bg-[#8BB436] text-white hover:bg-[#729c25] disabled:opacity-50 disabled:cursor-not-allowed font-bold px-6 py-2.5 rounded-full text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              {isSubmittingKyc ? "Submitting..." : "Submit KYC for Approval"}
              {isSubmittingKyc ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <IconCheck className="w-4 h-4" />
              )}
            </button>
          ) : currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="bg-[#1E293B] text-white hover:bg-slate-800 font-bold px-6 py-2.5 rounded-full text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              Continue
              <IconArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!isGenerated || isCompletingSetup}
              className="bg-[#8BB436] text-white hover:bg-[#729c25] disabled:opacity-50 disabled:cursor-not-allowed font-bold px-6 py-2.5 rounded-full text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              {isCompletingSetup ? "Completing Setup..." : "Complete Setup"}
              {isCompletingSetup ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <IconCheck className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

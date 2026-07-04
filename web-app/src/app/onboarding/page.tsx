"use client";

import React, { useState, useEffect } from "react";
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
  IconKey
} from "@tabler/icons-react";
import { AhnaraCard } from "@/components/ahnara/AhnaraCard";
import { AhnaraButton } from "@/components/ahnara/AhnaraButton";
import { AhnaraInput } from "@/components/ahnara/AhnaraInput";
import PaystackButton from "@/components/ahnara/PaystackButton";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Brand Info state
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("Cosmetics");
  const [website, setWebsite] = useState("");
  const [hqAddress, setHqAddress] = useState("");
  
  // Step 2: Plan Selection state
  const [selectedPlan, setSelectedPlan] = useState("Standard");

  // Step 3: API Key state
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isGenerated, setIsGenerated] = useState(false);

  // Generate mock default details on mount
  useEffect(() => {
    setBrandName("Aura Labs Inc");
    setWebsite("auralabs.com");
    setHqAddress("Lekki phase 1, Lagos, Nigeria");
  }, []);

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
    if (currentStep === 2 && !selectedPlan) {
      alert("Please select a subscription level.");
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleComplete = () => {
    // Save settings to LocalStorage for persistence
    const onboardingData = {
      brandName,
      industry,
      website,
      hqAddress,
      selectedPlan,
      apiKey,
      apiSecret,
      setupCompleted: true,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem("producer_brand_data", JSON.stringify(onboardingData));
    
    // Direct redirect to producer dashboard
    router.push("/producer/dashboard");
  };

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
          {[1, 2, 3].map((step) => (
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
                  {step === 1 && "Brand Profile"}
                  {step === 2 && "License Plan"}
                  {step === 3 && "API Credentials"}
                </span>
              </div>
              {step < 3 && (
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

            {/* STEP 2: PLAN SELECTION */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
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
                      <h4 className="text-lg font-black text-slate-800">50,000</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Codes issued / month</p>
                    </div>
                    <ul className="text-[10px] text-slate-500 flex flex-col gap-1 mt-2 font-medium border-t border-slate-100 pt-3">
                      <li>✓ Single Brand</li>
                      <li>✓ Core Analytics</li>
                    </ul>
                  </div>

                  {/* Standard Plan */}
                  <div 
                    onClick={() => setSelectedPlan("Standard")}
                    className={`border-2 rounded-2xl p-5 cursor-pointer flex flex-col gap-3 transition-all ${
                      selectedPlan === "Standard"
                        ? "border-[#1E293B] bg-slate-50/50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Standard</span>
                    <div>
                      <h4 className="text-lg font-black text-slate-800">100,000</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Codes issued / month</p>
                    </div>
                    <ul className="text-[10px] text-slate-500 flex flex-col gap-1 mt-2 font-medium border-t border-slate-100 pt-3">
                      <li>✓ Multi-brand catalog</li>
                      <li>✓ Regional map intel</li>
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
                      <h4 className="text-lg font-black text-slate-800">1,000,000</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Codes issued / month</p>
                    </div>
                    <ul className="text-[10px] text-slate-500 flex flex-col gap-1 mt-2 font-medium border-t border-slate-100 pt-3">
                      <li>✓ Custom limits</li>
                      <li>✓ Platform-wide API</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: API CREDENTIALS */}
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

          {currentStep === 2 ? (
            <PaystackButton
              config={{
                reference: "pay_" + Math.random().toString(36).substring(2, 12),
                email: "billing@brand.com",
                amount: selectedPlan === "Growth" ? 3000000 : selectedPlan === "Standard" ? 10000000 : 50000000,
                publicKey: "pk_test_1573581f39d4a4aa7486dc09a13d91856f085063",
              }}
              onSuccess={(ref) => {
                alert(`Payment Confirmed. Tx Ref: ${ref.reference}. Activating plan...`);
                setCurrentStep(3);
              }}
              onClose={() => {
                alert("Checkout flow terminated by user.");
              }}
              text={`Pay & Activate ${selectedPlan}`}
              className="bg-[#1E293B] text-white hover:bg-slate-800 font-bold px-6 py-2.5 rounded-full text-xs shadow-md"
            />
          ) : currentStep < 3 ? (
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
              disabled={!isGenerated}
              className="bg-[#8BB436] text-white hover:bg-[#729c25] disabled:opacity-50 disabled:cursor-not-allowed font-bold px-6 py-2.5 rounded-full text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              Complete Setup
              <IconCheck className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

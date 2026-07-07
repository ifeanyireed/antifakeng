"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IconBuilding,
  IconMail,
  IconShield,
  IconCreditCard,
  IconCheck,
  IconDeviceFloppy,
  IconUser,
  IconSettings,
  IconKey
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { AhnaraLoader } from "@/components/ahnara/AhnaraLoader";
import dynamic from "next/dynamic";

const PaystackButton = dynamic(
  () => import("@/components/ahnara/PaystackButton"),
  { ssr: false }
);

export default function ProducerProfile() {
  const [activeTab, setActiveTab] = useState<"company" | "security" | "subscription" | "api">("company");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [planTier, setPlanTier] = useState("Growth");
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState("");
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  const [formData, setFormData] = useState({
    name: "Aura Labs Inc",
    slug: "aura",
    contactEmail: "hello@auraskin.com",
    logoUrl: "/logo.png",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    const fetchProfileAndSummary = async () => {
      try {
        setIsLoading(true);
        const [profile, summaryData] = await Promise.all([
          api.get("/producer/profile").catch(() => null),
          api.get("/analytics/summary").catch(() => null)
        ]);

        if (profile) {
          const tier = profile.plan_tier ? profile.plan_tier.charAt(0).toUpperCase() + profile.plan_tier.slice(1).toLowerCase() : "Growth";
          setPlanTier(tier);
          setApiKey(profile.api_key || "Not provisioned");
          setApiSecret(profile.api_secret || "Not provisioned");
          setFormData((prev) => ({
            ...prev,
            name: profile.name,
            slug: profile.slug,
            contactEmail: profile.contact_email,
            logoUrl: profile.brand_logo_url || "/logo.png"
          }));
        }
        if (summaryData) {
          setSummary(summaryData);
        }
      } catch (err) {
        console.error("Failed to load profile settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndSummary();
  }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");
      await api.put("/producer/profile", {
        name: formData.name,
        contact_email: formData.contactEmail,
        brand_logo_url: formData.logoUrl,
        plan_tier: planTier.toLowerCase()
      });
      setSuccessMsg("Company details saved successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update company details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");
      
      await api.post("/auth/change-password", {
        current_password: formData.currentPassword,
        new_password: formData.newPassword
      });

      setSuccessMsg("Security credentials updated successfully!");
      setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const plans = [
    {
      name: "Starter",
      price: "₦150,000",
      period: "month",
      limit: "25,000 codes / mo",
      desc: "For small production lines getting verification codes into the market.",
      badge: "Popular"
    },
    {
      name: "Growth",
      price: "₦450,000",
      period: "month",
      limit: "250,000 codes / mo",
      desc: "For growing brands needing high volume batch processing and detailed analytics.",
      badge: "Professional"
    },
    {
      name: "Enterprise",
      price: "Custom Pricing",
      period: "contract",
      limit: "Unlimited codes",
      desc: "For multi-brand operations, custom ERP integrations, and high-volume printers.",
      badge: "Corporate"
    }
  ];

  const handlePlanUpgrade = async (newPlan: string) => {
    try {
      setIsChangingPlan(true);
      setErrorMsg("");
      setSuccessMsg("");
      const isEnterprise = newPlan.toLowerCase() === "enterprise";
      
      await api.put("/producer/profile", {
        name: formData.name,
        contact_email: formData.contactEmail,
        brand_logo_url: formData.logoUrl,
        plan_tier: newPlan.toLowerCase(),
        status: isEnterprise ? "pending_approval" : "active"
      });

      const updatedTier = newPlan.charAt(0).toUpperCase() + newPlan.slice(1).toLowerCase();
      setPlanTier(updatedTier);
      
      if (isEnterprise) {
        alert("Enterprise upgrade request submitted successfully! Your account plan change is pending administrator approval.");
      } else {
        setSuccessMsg(`Plan successfully updated to ${updatedTier}!`);
        setTimeout(() => setSuccessMsg(""), 4000);
      }
      setShowPlanModal(false);
      setSelectedNewPlan("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update subscription plan.");
    } finally {
      setIsChangingPlan(false);
    }
  };

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File size exceeds 10MB limit.");
      return;
    }

    try {
      setIsUploadingLogo(true);
      setErrorMsg("");
      setSuccessMsg("");
      
      const uploadData = new FormData();
      uploadData.append("image", file);

      const resData = await api.upload("/producer/upload", uploadData);
      if (resData.url) {
        setFormData((prev) => ({ ...prev, logoUrl: resData.url }));
        setSuccessMsg("Logo uploaded successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        throw new Error("Upload succeeded but did not return a file URL.");
      }
    } catch (err: any) {
      console.error("Logo upload error:", err);
      setErrorMsg(err.message || "Failed to upload logo image.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <AhnaraLoader label="Loading Settings..." />
      </div>
    );
  }

  const scansCount = summary?.scans_count || 0;

  return (
    <div className="w-full max-w-4xl mx-auto text-left flex flex-col gap-6 animate-fade-in">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight text-display">Settings & Profile</h2>
        <p className="text-slate-500 font-medium mt-1">
          Manage your manufacturer account details, safety keys, and plan subscriptions.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* Left Side Tabs */}
        <aside className="w-full md:w-64 bg-white border border-slate-200/60 rounded-3xl p-3 shadow-xs flex flex-col gap-1">
          <button
            onClick={() => { setActiveTab("company"); setErrorMsg(""); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === "company"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
            }`}
          >
            <IconBuilding className="w-5 h-5 text-slate-500" />
            Company Details
          </button>
          <button
            onClick={() => { setActiveTab("security"); setErrorMsg(""); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === "security"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
            }`}
          >
            <IconShield className="w-5 h-5 text-slate-500" />
            Security & Login
          </button>
          <button
            onClick={() => { setActiveTab("subscription"); setErrorMsg(""); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === "subscription"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
            }`}
          >
            <IconCreditCard className="w-5 h-5 text-slate-500" />
            Billing & Usage
          </button>
          <button
            onClick={() => { setActiveTab("api"); setErrorMsg(""); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === "api"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
            }`}
          >
            <IconKey className="w-5 h-5 text-slate-500" />
            API Keys
          </button>
        </aside>

        {/* Right Side Settings Panel */}
        <main className="flex-1 w-full bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs relative">
          
          {successMsg && (
            <div className="absolute top-4 right-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-xs z-20">
              <IconCheck className="w-4 h-4" />
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold px-4 py-2.5 rounded-xl">
              {errorMsg}
            </div>
          )}

          {activeTab === "company" && (
            <form onSubmit={handleSaveCompany} className="flex flex-col gap-5">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Company Information</h3>
                <p className="text-slate-400 text-xs mt-0.5">Edit details associated with your manufacturer brand identity.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brand Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brand Slug (URL Prefix)</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    disabled
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-400 outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brand Logo</label>
                <div className="flex items-center gap-4">
                  <img
                    src={formData.logoUrl}
                    alt="Brand Logo"
                    className="w-16 h-16 rounded-2xl object-contain border border-slate-200 bg-slate-50 shadow-xs"
                  />
                  <div className="flex flex-col gap-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      id="logo-upload-input"
                      className="hidden"
                    />
                    <label
                      htmlFor="logo-upload-input"
                      className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-[#F1F5F9] hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs"
                    >
                      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {isUploadingLogo ? "Uploading..." : "Upload logo image"}
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">PNG, JPG or SVG. Max 10MB.</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="self-start flex items-center gap-1.5 px-5 py-3 bg-[#1E293B] hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-xs transition-all mt-2 disabled:opacity-50"
              >
                <IconDeviceFloppy className="w-4 h-4" />
                {isSubmitting ? "Saving changes..." : "Save profile settings"}
              </button>
            </form>
          )}

          {activeTab === "security" && (
            <form onSubmit={handleSaveSecurity} className="flex flex-col gap-5">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Security Credentials</h3>
                <p className="text-slate-400 text-xs mt-0.5">Ensure your account is protected with a secure password configuration.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="self-start flex items-center gap-1.5 px-5 py-3 bg-[#1E293B] hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-xs transition-all mt-2 disabled:opacity-50"
              >
                <IconShield className="w-4 h-4" />
                {isSubmitting ? "Updating..." : "Update security keys"}
              </button>
            </form>
          )}

          {activeTab === "subscription" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Billing &amp; API Usage limits</h3>
                <p className="text-slate-400 text-xs mt-0.5">Review active service tier features and token consumption statistics.</p>
              </div>

              {/* Active Plan Detail */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Current Tier</span>
                  <h4 className="text-lg font-black text-slate-800">
                    {planTier === "Starter" && "Starter Plan (Monthly Subscription)"}
                    {planTier === "Growth" && "Growth Plan (Monthly Subscription)"}
                    {planTier === "Enterprise" && "Enterprise Plan (Custom License)"}
                    {(planTier === "Free" || planTier === "free") && "Free Plan (Inactive)"}
                    {!["Starter", "Growth", "Enterprise", "Free", "free"].includes(planTier) && `${planTier} Plan (Active)`}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {planTier === "Starter" && "Billed ₦150,000 monthly. Renewal date: Aug 04, 2026."}
                    {planTier === "Growth" && "Billed ₦450,000 monthly. Renewal date: Aug 04, 2026."}
                    {planTier === "Enterprise" && "Billed Custom rate monthly. Renewal date: Aug 04, 2026."}
                    {(planTier === "Free" || planTier === "free") && "Billed ₦0 monthly. Please select a subscription plan to begin issuing codes."}
                    {!["Starter", "Growth", "Enterprise", "Free", "free"].includes(planTier) && "Billed monthly subscription. Renewal date: Aug 04, 2026."}
                  </p>
                </div>
                <button 
                  onClick={() => setShowPlanModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  Change Plan
                </button>
              </div>

              {/* Usage Progress */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">QR Generation Limit (This Month)</span>
                  <span className="text-xs font-black text-slate-800">
                    {planTier === "Starter" && `${scansCount.toLocaleString()} / 25,000 codes`}
                    {planTier === "Growth" && `${scansCount.toLocaleString()} / 250,000 codes`}
                    {planTier === "Enterprise" && `${scansCount.toLocaleString()} / Unlimited codes`}
                    {(planTier === "Free" || planTier === "free") && `${scansCount.toLocaleString()} / 0 codes`}
                    {!["Starter", "Growth", "Enterprise", "Free", "free"].includes(planTier) && `${scansCount.toLocaleString()} / 250,000 codes`}
                  </span>
                </div>
                {/* Progress bar container */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ 
                      width: 
                        planTier === "Starter" ? `${Math.min((scansCount / 25000) * 100, 100)}%` : 
                        planTier === "Growth" ? `${Math.min((scansCount / 250000) * 100, 100)}%` : 
                        planTier === "Enterprise" ? "0.1%" :
                        (planTier === "Free" || planTier === "free") ? "0%" :
                        `${Math.min((scansCount / 250000) * 100, 100)}%`
                    }} 
                  />
                </div>
                <p className="text-slate-400 text-[10px] font-medium leading-normal">
                  Calculated from 1st of the calendar month. Limits refresh on August 1st.
                </p>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="flex flex-col gap-5 text-left">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Developer API Provisioning</h3>
                <p className="text-slate-400 text-xs mt-0.5">Integrate AntiFakeNG with your ERP, printing conveyor lines, or labeling machinery.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col gap-4 font-semibold text-slate-600 text-xs mt-2">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Client API ID</span>
                  <input
                    type="text"
                    value={apiKey}
                    readOnly
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-800 mt-1 focus:outline-none"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Private Client Secret</span>
                  <input
                    type="text"
                    value={apiSecret}
                    readOnly
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-800 mt-1 focus:outline-none"
                  />
                  <p className="text-[9px] text-slate-400 font-medium mt-1">
                    These API credentials allow secure machine-to-machine transactions. Keep your secret key safe and do not share it.
                  </p>
                </div>
              </div>

              {apiKey === "Not provisioned" && (
                <button
                  onClick={async () => {
                    try {
                      setIsSubmitting(true);
                      setErrorMsg("");
                      setSuccessMsg("");
                      
                      const newKey = "ak_live_" + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
                      const newSecret = "sk_live_" + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
                      
                      await api.put("/producer/profile", {
                        name: formData.name,
                        contact_email: formData.contactEmail,
                        brand_logo_url: formData.logoUrl,
                        plan_tier: planTier.toLowerCase(),
                        api_key: newKey,
                        api_secret: newSecret
                      });
                      
                      setApiKey(newKey);
                      setApiSecret(newSecret);
                      setSuccessMsg("API Keys generated and saved successfully!");
                      setTimeout(() => setSuccessMsg(""), 3000);
                    } catch (err: any) {
                      setErrorMsg(err.message || "Failed to generate API Keys.");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="self-start px-5 py-3 bg-[#1E293B] hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-xs transition-all mt-2 disabled:opacity-50"
                >
                  {isSubmitting ? "Generating..." : "Generate New Keys"}
                </button>
              )}
            </div>
          )}

        </main>
      </div>

      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 select-none">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 flex flex-col gap-6 relative text-left font-sans"
          >
            {/* Close Button */}
            <button 
              onClick={() => {
                setShowPlanModal(false);
                setSelectedNewPlan("");
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-black text-lg transition-colors p-1"
            >
              ✕
            </button>

            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Select Subscription Plan</h3>
              <p className="text-slate-400 text-xs mt-1">Upgrade or scale down your active plan tier. Upgrades apply instantly.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const isCurrent = planTier.toLowerCase() === plan.name.toLowerCase();
                const isSelected = selectedNewPlan.toLowerCase() === plan.name.toLowerCase();
                return (
                  <div
                    key={plan.name}
                    onClick={() => {
                      if (!isCurrent) {
                        setSelectedNewPlan(plan.name);
                      }
                    }}
                    className={`border rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-all ${
                      isCurrent 
                        ? "border-[#245C44] bg-[#245C44]/5 cursor-not-allowed text-slate-500" 
                        : isSelected 
                        ? "border-[#1E293B] bg-slate-50 ring-2 ring-slate-800/20 shadow-xs" 
                        : "border-slate-200 hover:border-slate-400 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{plan.badge}</span>
                      {isCurrent && (
                        <span className="bg-[#245C44] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{plan.name}</h4>
                      <p className="text-xs text-slate-400 font-bold mt-0.5">{plan.limit}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed flex-1 mt-1">{plan.desc}</p>
                    <div className="pt-2 border-t border-slate-100 mt-2">
                      <span className="text-sm font-black text-slate-800">{plan.price}</span>
                      <span className="text-[9px] text-slate-400 font-bold lowercase">/{plan.period}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action buttons / Paystack */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              {selectedNewPlan ? (
                selectedNewPlan.toLowerCase() === "enterprise" ? (
                  <button
                    onClick={() => handlePlanUpgrade("Enterprise")}
                    disabled={isChangingPlan}
                    className="w-full bg-[#1E293B] hover:bg-slate-800 text-white font-bold py-3 rounded-full text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    {isChangingPlan ? "Submitting Request..." : "Request Enterprise Custom License"}
                  </button>
                ) : (
                  <PaystackButton
                    config={{
                      reference: "upgrade_" + Math.random().toString(36).substring(2, 12),
                      email: formData.contactEmail || "billing@brand.com",
                      amount: selectedNewPlan === "Starter" ? 15000000 : 45000000,
                      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
                    }}
                    onSuccess={(ref) => {
                      alert(`Payment Confirmed. Ref: ${ref.reference}. Updating plan...`);
                      handlePlanUpgrade(selectedNewPlan);
                    }}
                    onClose={() => {
                      alert("Subscription update checkout flow canceled.");
                    }}
                    text={`Pay ₦${selectedNewPlan === "Starter" ? "150,000" : "450,000"} & Activate ${selectedNewPlan}`}
                    className="w-full bg-[#1E293B] text-white hover:bg-slate-800 py-3 rounded-full text-xs font-bold shadow-md text-center"
                  />
                )
              ) : (
                <button
                  disabled
                  className="w-full bg-slate-100 text-slate-400 font-bold py-3 rounded-full text-xs cursor-not-allowed border border-slate-200/50"
                >
                  Choose a Plan Above to Continue
                </button>
              )}
              
              <button
                onClick={() => {
                  setShowPlanModal(false);
                  setSelectedNewPlan("");
                }}
                className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-2.5 rounded-full text-xs transition-colors"
              >
                Cancel
              </button>
            </div>

          </motion.div>
        </div>
      )}

    </div>
  );
}

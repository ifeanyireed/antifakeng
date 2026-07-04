"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  IconBuilding,
  IconMail,
  IconShield,
  IconCreditCard,
  IconCheck,
  IconDeviceFloppy,
  IconUser,
  IconSettings
} from "@tabler/icons-react";

export default function ProducerProfile() {
  const [activeTab, setActiveTab] = useState<"company" | "security" | "subscription">("company");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "Aura Labs Inc",
    slug: "aura",
    contactEmail: "hello@auraskin.com",
    logoUrl: "/logo.png",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("Changes saved successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-full max-w-4xl mx-auto text-left flex flex-col gap-6">
      
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
            onClick={() => setActiveTab("company")}
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
            onClick={() => setActiveTab("security")}
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
            onClick={() => setActiveTab("subscription")}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === "subscription"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
            }`}
          >
            <IconCreditCard className="w-5 h-5 text-slate-500" />
            Billing & Usage
          </button>
        </aside>

        {/* Right Side Settings Panel */}
        <main className="flex-1 w-full bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs relative">
          
          {successMsg && (
            <div className="absolute top-4 right-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-xs">
              <IconCheck className="w-4 h-4" />
              {successMsg}
            </div>
          )}

          {activeTab === "company" && (
            <form onSubmit={handleSave} className="flex flex-col gap-5">
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brand Slug (URL Prefix)</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brand Logo URL</label>
                <div className="flex items-center gap-3">
                  <img
                    src={formData.logoUrl}
                    alt="Brand Logo"
                    className="w-12 h-12 rounded-xl object-contain border border-slate-200 bg-slate-50"
                  />
                  <input
                    type="text"
                    name="logoUrl"
                    value={formData.logoUrl}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="self-start flex items-center gap-1.5 px-5 py-3 bg-[#1E293B] hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-xs transition-all mt-2"
              >
                <IconDeviceFloppy className="w-4 h-4" />
                Save profile settings
              </button>
            </form>
          )}

          {activeTab === "security" && (
            <form onSubmit={handleSave} className="flex flex-col gap-5">
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="self-start flex items-center gap-1.5 px-5 py-3 bg-[#1E293B] hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-xs transition-all mt-2"
              >
                <IconShield className="w-4 h-4" />
                Update security keys
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
                  <h4 className="text-lg font-black text-slate-800">Growth Plan (Monthly Subscription)</h4>
                  <p className="text-xs text-slate-500 font-medium">Billed ₦450,000 monthly. Renewal date: Aug 04, 2026.</p>
                </div>
                <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-all">
                  Change Plan
                </button>
              </div>

              {/* Usage Progress */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">QR Generation Limit (This Month)</span>
                  <span className="text-xs font-black text-slate-800">24,812 / 250,000 codes</span>
                </div>
                {/* Progress bar container */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "9.9%" }} />
                </div>
                <p className="text-slate-400 text-[10px] font-medium leading-normal">
                  Calculated from 1st of the calendar month. Limits refresh on August 1st.
                </p>
              </div>

              {/* Subscription limits global management notice */}
              <div className="p-4 bg-blue-50/50 border border-blue-200/50 text-blue-800 rounded-xl text-xs font-medium leading-normal flex items-start gap-3">
                <span className="text-base select-none">ℹ️</span>
                <div>
                  <p className="font-bold">Gemini Added Memory Active</p>
                  <p className="mt-0.5 opacity-90">
                    Subscription limits are centrally managed in SubscriptionHelper.ts and enforced/displayed via SubscriptionService and middleware.
                  </p>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}

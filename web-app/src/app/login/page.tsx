"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/ahnara/AuthContext";
import { AhnaraCard } from "@/components/ahnara/AhnaraCard";
import { AhnaraButton } from "@/components/ahnara/AhnaraButton";
import { AhnaraInput } from "@/components/ahnara/AhnaraInput";
import { IconLock, IconMail, IconArrowRight } from "@tabler/icons-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      setIsLoading(false);

      if (res.ok) {
        const data = await res.json();
        
        login(data.token, {
          id: data.producer_id || "mock-producer-id",
          email: data.email,
          name: data.role === "admin" ? "Platform Admin" : "Brand Admin",
          role: data.role.toUpperCase(),
        });

        localStorage.setItem("ahnara_token", data.token);

        if (data.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          const status = data.producer_status;
          if (status === "pending_approval") {
            setError("Your account is pending administrator approval.");
          } else if (status === "pending_payment") {
            router.push("/onboarding");
          } else {
            router.push("/producer/dashboard");
          }
        }
      } else {
        const data = await res.json();
        setError(data.error || "Invalid credentials.");
      }
    } catch (err) {
      setIsLoading(false);
      setError("Authentication service is currently offline.");
    }
  };

  const handleQuickLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@auraskin.com", password: "aura123456" })
      });
      setIsLoading(false);
      if (res.ok) {
        const data = await res.json();
        login(data.token, {
          id: data.producer_id,
          email: data.email,
          name: "AURA Skincare Admin",
          role: data.role.toUpperCase(),
        });
        localStorage.setItem("ahnara_token", data.token);
        
        const status = data.producer_status;
        if (status === "pending_approval") {
          setError("Your account is pending administrator approval.");
        } else if (status === "pending_payment") {
          router.push("/onboarding");
        } else {
          router.push("/producer/dashboard");
        }
      } else {
        setError("Failed to run seed quick login.");
      }
    } catch (err) {
      setIsLoading(false);
      setError("Authentication service is currently offline.");
    }
  };

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#D4F475]/30 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#0089C1]/10 rounded-full filter blur-3xl pointer-events-none" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="w-full max-w-md z-10 animate-fade-in"
      >
        <AhnaraCard variant="flat" className="bg-white/85 backdrop-blur-md border border-slate-200/80 p-8 shadow-2xl rounded-3xl flex flex-col gap-6">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center gap-2">
            <Link href="/" className="flex items-center justify-center hover:scale-105 transition-transform mb-2">
              <img src="/logo.png" alt="AntiFakeNG Logo" className="w-12 h-12 object-contain" />
            </Link>
            <h2 className="text-2xl font-black tracking-tight text-slate-800 text-display">Producer Portal</h2>
            <p className="text-xs text-slate-400 font-semibold">Access your brand catalog &amp; anti-counterfeit analytics dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <AhnaraInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<IconMail className="w-5 h-5 text-slate-400" />}
            />

            <AhnaraInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<IconLock className="w-5 h-5 text-slate-400" />}
            />

            <AhnaraButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-[#1E293B] text-white hover:bg-slate-800 rounded-xl mt-2"
              isLoading={isLoading}
              rightIcon={<IconArrowRight className="w-4 h-4" />}
            >
              Sign In
            </AhnaraButton>
          </form>

          {/* Quick Login Shortcuts */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-center">Demo Quick Login</span>
            <button
              type="button"
              onClick={handleQuickLogin}
              className="w-full py-3 px-3 bg-[#E8F3CE]/60 hover:bg-[#E8F3CE]/80 border border-[#CDE0A4]/45 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#608216] transition-colors"
            >
              Quick Login as Producer
            </button>
          </div>

          {/* Footnotes */}
          <div className="text-center mt-2">
            <span className="text-xs text-slate-400 font-semibold">
              Don't have an account?{" "}
              <Link href="/register" className="text-[#0089C1] hover:underline font-bold">
                Register Brand here
              </Link>
            </span>
          </div>

        </AhnaraCard>
      </motion.div>

    </div>
  );
}

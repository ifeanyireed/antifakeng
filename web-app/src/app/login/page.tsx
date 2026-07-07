"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/ahnara/AuthContext";
import { AhnaraCard } from "@/components/ahnara/AhnaraCard";
import { AhnaraButton } from "@/components/ahnara/AhnaraButton";
import { AhnaraInput } from "@/components/ahnara/AhnaraInput";
import { 
  IconLock, 
  IconMail, 
  IconArrowRight, 
  IconUser, 
  IconShieldLock, 
  IconCircleCheck, 
  IconAlertCircle, 
  IconChevronLeft 
} from "@tabler/icons-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [view, setView] = useState<"login" | "register" | "forgot">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${API_BASE}/api/auth/login`, {
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
          } else if (status === "pending_verification") {
            localStorage.setItem("verify_email_address", email);
            router.push("/verify-email");
          } else if (status === "pending_payment" || status === "kyc_approved") {
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producer_name: name,
          producer_slug: slug,
          contact_email: email,
          plan_tier: "free",
          email: email,
          password: password
        })
      });

      if (res.ok) {
        const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        
        setIsLoading(false);
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          login(loginData.token, {
            id: String(loginData.producer_id),
            email: loginData.email,
            name: name,
            role: "PRODUCER",
          });
          localStorage.setItem("ahnara_token", loginData.token);
          const status = loginData.producer_status;
          if (status === "pending_verification") {
            localStorage.setItem("verify_email_address", email);
            router.push("/verify-email");
          } else if (status === "pending_payment" || status === "kyc_approved") {
            router.push("/onboarding");
          } else {
            router.push("/producer/dashboard");
          }
        } else {
          setView("login");
          setSuccessMessage("Registration successful! Please log in.");
        }
      } else {
        setIsLoading(false);
        const data = await res.json();
        setError(data.error || "Failed to register brand.");
      }
    } catch (err) {
      setIsLoading(false);
      setError("Registration service is currently offline.");
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Mock reset password flow since backend does not have reset password implementation yet
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setSuccessMessage(`A password reset link has been sent to ${email} (Mock service).`);
  };

  const handleViewChange = (newView: "login" | "register" | "forgot") => {
    setView(newView);
    setError(null);
    setSuccessMessage(null);
    // Reset passwords for security
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#D4F475]/30 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#0089C1]/10 rounded-full filter blur-3xl pointer-events-none" />

      {/* Main card wrapper */}
      <div className="w-full max-w-md z-10">
        <AnimatePresence mode="wait">
          {view === "login" && (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
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
                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                  {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
                      <IconAlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  {successMessage && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
                      <IconCircleCheck className="w-4 h-4 flex-shrink-0" />
                      <span>{successMessage}</span>
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

                  <div className="flex flex-col gap-1.5">
                    <AhnaraInput
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      leftIcon={<IconLock className="w-5 h-5 text-slate-400" />}
                    />
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => handleViewChange("forgot")}
                        className="text-xs text-[#0089C1] hover:underline font-bold"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  <AhnaraButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full bg-[#1E293B] text-white hover:bg-slate-800 rounded-xl mt-1"
                    isLoading={isLoading}
                    rightIcon={<IconArrowRight className="w-4 h-4" />}
                  >
                    Sign In
                  </AhnaraButton>
                </form>



                {/* Footnotes */}
                <div className="text-center mt-2">
                  <span className="text-xs text-slate-400 font-semibold">
                    Don't have an account?{" "}
                    <button
                      onClick={() => handleViewChange("register")}
                      className="text-[#0089C1] hover:underline font-bold"
                    >
                      Register Brand here
                    </button>
                  </span>
                </div>

              </AhnaraCard>
            </motion.div>
          )}

          {view === "register" && (
            <motion.div
              key="register-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <AhnaraCard variant="flat" className="bg-white/85 backdrop-blur-md border border-slate-200/80 p-8 shadow-2xl rounded-3xl flex flex-col gap-6">
                
                {/* Logo & Header */}
                <div className="flex flex-col items-center text-center gap-2">
                  <Link href="/" className="flex items-center justify-center hover:scale-105 transition-transform mb-2">
                    <img src="/logo.png" alt="AntiFakeNG Logo" className="w-12 h-12 object-contain" />
                  </Link>
                  <h2 className="text-2xl font-black tracking-tight text-slate-800 text-display">Register Brand</h2>
                  <p className="text-xs text-slate-400 font-semibold">Join AntiFakeNG and secure your product supply chain</p>
                </div>

                {/* Form */}
                <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
                  {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
                      <IconAlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <AhnaraInput
                    label="Brand Representative Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    leftIcon={<IconUser className="w-5 h-5 text-slate-400" />}
                  />

                  <AhnaraInput
                    label="Corporate Email Address"
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

                  <AhnaraInput
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    leftIcon={<IconShieldLock className="w-5 h-5 text-slate-400" />}
                  />

                  <AhnaraButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full bg-[#1E293B] text-white hover:bg-slate-800 rounded-xl mt-1"
                    isLoading={isLoading}
                    rightIcon={<IconArrowRight className="w-4 h-4" />}
                  >
                    Register Brand
                  </AhnaraButton>
                </form>



                {/* Footnotes */}
                <div className="text-center mt-2">
                  <span className="text-xs text-slate-400 font-semibold">
                    Already have a brand account?{" "}
                    <button
                      onClick={() => handleViewChange("login")}
                      className="text-[#0089C1] hover:underline font-bold"
                    >
                      Sign In here
                    </button>
                  </span>
                </div>

              </AhnaraCard>
            </motion.div>
          )}

          {view === "forgot" && (
            <motion.div
              key="forgot-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <AhnaraCard variant="flat" className="bg-white/85 backdrop-blur-md border border-slate-200/80 p-8 shadow-2xl rounded-3xl flex flex-col gap-6">
                
                {/* Logo & Header */}
                <div className="flex flex-col items-center text-center gap-2">
                  <Link href="/" className="flex items-center justify-center hover:scale-105 transition-transform mb-2">
                    <img src="/logo.png" alt="AntiFakeNG Logo" className="w-12 h-12 object-contain" />
                  </Link>
                  <h2 className="text-2xl font-black tracking-tight text-slate-800 text-display">Reset Password</h2>
                  <p className="text-xs text-slate-400 font-semibold">Enter your email address to recover your producer account</p>
                </div>

                {/* Form */}
                <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                  {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
                      <IconAlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  {successMessage && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
                      <IconCircleCheck className="w-4 h-4 flex-shrink-0" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  <AhnaraInput
                    label="Corporate Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    leftIcon={<IconMail className="w-5 h-5 text-slate-400" />}
                  />

                  <AhnaraButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full bg-[#1E293B] text-white hover:bg-slate-800 rounded-xl mt-1"
                    isLoading={isLoading}
                    rightIcon={<IconArrowRight className="w-4 h-4" />}
                  >
                    Send Reset Link
                  </AhnaraButton>
                </form>

                {/* Footnotes */}
                <div className="text-center mt-2 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => handleViewChange("login")}
                    className="text-xs text-[#0089C1] hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <IconChevronLeft className="w-4 h-4" />
                    Back to Sign In
                  </button>
                </div>

              </AhnaraCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

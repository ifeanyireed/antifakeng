"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { IconHeadphones, IconX } from "@tabler/icons-react";

const renderMarkdown = (content: string) => {
  const parts = content.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-extrabold">{part.slice(2, -2)}</strong>;
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a 
          key={index} 
          href={linkMatch[2]} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-[#0089C1] hover:underline font-bold"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
};

interface FAQItem {
  question: string;
  answer: string;
  category: "general" | "consumer" | "brand";
}

const FAQ_DATA: FAQItem[] = [
  {
    category: "general",
    question: "What is AntiFakeNG?",
    answer: "AntiFakeNG is a modern product authenticity platform that secures manufacturer goods using unique, encrypted QR codes and serial tokens. It allows consumers to immediately verify if a product is genuine before purchasing, while giving brands real-time insights into counterfeit attempts."
  },
  {
    category: "general",
    question: "How does the verification process work?",
    answer: "Every physical product unit features a secure AntiFakeNG label. When you scan the QR code with your phone camera, or enter the 8-digit serial code manually on our portal, we check our database. If the token is valid, we prompt you to bind your session with a phone number (via WhatsApp or SMS) to verify your session and unlock loyalty rewards."
  },
  {
    category: "consumer",
    question: "Why should I verify using my own phone number?",
    answer: "Entering your own phone number guarantees that the verification session is bound to you. This protects against copycat labels (where a counterfeiter copies a single real code and prints it thousands of times) and ensures you receive official reward points and transaction logs."
  },
  {
    category: "consumer",
    question: "What should I do if a product fails verification?",
    answer: "If the system reports 'Verdict: SUSPICIOUS' or 'INVALID', do not purchase or use the product. You can file an anonymous report directly on this page or through the verification verdict screen to notify the brand manufacturer immediately."
  },
  {
    category: "consumer",
    question: "Why did I not receive my WhatsApp or SMS OTP code?",
    answer: "Please ensure you selected the correct Delivery Channel (WhatsApp is recommended and selected by default). Verify that your phone number was entered in the proper international format (with country code, e.g. 23480xxxxxxxx). If the issue persists, request a new code or switch to SMS."
  },
  {
    category: "brand",
    question: "How do we generate QR code batches for printing?",
    answer: "Producers can sign in to the Brand Dashboard, go to Batches, and click 'Create Batch'. You can specify the number of codes (e.g., 2000) and download them as a print-ready PDF or high-resolution CSV. PDF layouts are automatically optimized for standard roll width options."
  },
  {
    category: "brand",
    question: "What is the 'grid roll width' layout system?",
    answer: "When printing labels, the layout grid auto-fits the maximum number of 80mm labels that fit across the roll width with a consistent 1px spacing (TBLR) to ensure high-speed, perfect label cutting."
  }
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "general" | "consumer" | "brand">("all");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Form states
  const [formType, setFormType] = useState<"contact" | "report">("contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [token, setToken] = useState("");
  const [storeName, setStoreName] = useState("");
  const [message, setMessage] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Hello! I am your AntiFakeNG support assistant. Ask me anything about verifying products, printing layouts, or managing security!"
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${API_BASE}/api/analytics/support/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...chatMessages.map(m => ({ role: m.role, content: m.content })), { role: "user", content: userMessage }]
        })
      });

      const data = await response.json();
      if (response.ok && data.reply) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setChatMessages((prev) => [...prev, { role: "assistant", content: `Error: ${data.error || "Failed to get reply."}` }]);
      }
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: `Network error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Filtered FAQs
  const filteredFAQs = useMemo(() => {
    return FAQ_DATA.filter(faq => {
      const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
      const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${API_BASE}/api/auth/support/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          form_type: formType,
          name: name,
          email: email,
          phone: phone,
          subject: subject,
          token: token,
          store_name: storeName,
          message: message
        })
      });

      if (res.ok) {
        setFormSubmitted(true);
        // Reset states after submission
        setName("");
        setEmail("");
        setPhone("");
        setSubject("");
        setToken("");
        setStoreName("");
        setMessage("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit support request.");
      }
    } catch (err) {
      alert("Support service is currently offline.");
    }
  };

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-slate-800 font-sans flex flex-col overflow-x-hidden">
      
      {/* NAVBAR */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-50 sticky top-0 bg-[#E8EFF4]/90 backdrop-blur-md border-b border-slate-300/20">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <img src="/logo.png" alt="AntiFakeNG Logo" className="w-10 h-10 object-contain" />
            <span className="font-extrabold text-xl tracking-tight text-slate-900 text-display">AntiFakeNG</span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/">
            <span className="hidden sm:inline-block text-sm font-bold text-slate-600 hover:text-slate-900 cursor-pointer transition-colors">Home</span>
          </Link>
          <Link href="/consumer">
            <button className="bg-[#0089C1] hover:bg-sky-600 text-white transition-all font-bold px-4 py-2 rounded-full text-xs shadow-sm">
              Verify Product
            </button>
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-6 mb-8 mt-6">
        <div className="w-full bg-[#E9F2F5] rounded-[36px] py-12 px-6 md:px-12 flex flex-col items-center text-center relative overflow-hidden border border-slate-200/20">
          <h1 id="support-main-heading" className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            How can we help you?
          </h1>
          <p className="text-slate-600 font-medium text-sm md:text-base mb-8 max-w-2xl">
            Find answers to frequently asked questions about product verification, or get in touch with our security and support teams.
          </p>

          {/* Search bar */}
          <div className="w-full max-w-md bg-white rounded-full p-1.5 shadow-md flex items-center border border-slate-200/80">
            <span className="pl-4 pr-2 text-slate-400">🔍</span>
            <input 
              id="faq-search-input"
              type="text" 
              placeholder="Search help topics..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none py-2 text-sm text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="pr-4 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* MAIN LAYOUT */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        
        {/* LEFT & CENTER COLS: FAQS */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/30">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span>❓</span> Frequently Asked Questions
            </h2>

            {/* Category Selectors */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(["all", "general", "consumer", "brand"] as const).map((cat) => (
                <button
                  id={`cat-btn-${cat}`}
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setExpandedIndex(null);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    activeCategory === cat 
                      ? "bg-[#1E293B] text-white" 
                      : "bg-[#F1F5F9] text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>

            {/* FAQs List */}
            <div className="flex flex-col gap-3">
              {filteredFAQs.length > 0 ? (
                filteredFAQs.map((faq, index) => {
                  const isExpanded = expandedIndex === index;
                  return (
                    <div 
                      key={index} 
                      className={`border rounded-2xl transition-all ${
                        isExpanded ? "border-[#0089C1] bg-sky-50/10" : "border-slate-100"
                      }`}
                    >
                      <button
                        id={`faq-btn-${index}`}
                        onClick={() => setExpandedIndex(isExpanded ? null : index)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
                      >
                        <span className="font-semibold text-sm md:text-base text-slate-800">
                          {faq.question}
                        </span>
                        <span className={`text-xs text-slate-400 font-bold transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                          ▼
                        </span>
                      </button>
                      
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p className="px-5 pb-5 pt-1 text-slate-600 text-xs md:text-sm leading-relaxed border-t border-slate-50">
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No FAQs found matching your search.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COL: CONTACT FORM */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/30 sticky top-24">
            
            {/* Form Type Tab Selector */}
            <div className="flex border-b border-slate-100 mb-6">
              <button
                id="tab-btn-contact"
                onClick={() => {
                  setFormType("contact");
                  setFormSubmitted(false);
                }}
                className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition-all ${
                  formType === "contact" 
                    ? "border-[#0089C1] text-slate-900" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                ✉️ Support
              </button>
              <button
                id="tab-btn-report"
                onClick={() => {
                  setFormType("report");
                  setFormSubmitted(false);
                }}
                className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition-all ${
                  formType === "report" 
                    ? "border-red-500 text-slate-900" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                ⚠️ Report Fake
              </button>
            </div>

            {formSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="text-4xl mb-4">
                  {formType === "contact" ? "🚀" : "🚨"}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {formType === "contact" ? "Message Received" : "Report Filed Successfully"}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  {formType === "contact" 
                    ? "Thank you for reaching out. A support agent will review your inquiry and contact you shortly."
                    : "Your report has been securely and anonymously filed. Our security team will investigate this token immediately."}
                </p>
                <button
                  id="reset-form-btn"
                  onClick={() => setFormSubmitted(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-full text-xs transition-colors"
                >
                  Send Another
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                
                {formType === "contact" ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your Name</label>
                      <input 
                        id="contact-name"
                        type="text" 
                        required 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe" 
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-[#0089C1] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                      <input 
                        id="contact-email"
                        type="email" 
                        required 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com" 
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-[#0089C1] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
                      <input 
                        id="contact-subject"
                        type="text" 
                        required 
                        value={subject} 
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Verification issue / Account query" 
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-[#0089C1] transition-colors"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Suspicious Serial Token</label>
                      <input 
                        id="report-token"
                        type="text" 
                        required 
                        value={token} 
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="e.g. K6Q5-7BKK" 
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Purchased From (Store / Retailer Name)</label>
                      <input 
                        id="report-store"
                        type="text" 
                        required 
                        value={storeName} 
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Supermarket / Pharmacy / Online vendor" 
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your Phone (Optional for follow up)</label>
                      <input 
                        id="report-phone"
                        type="tel" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 23480xxxxxxxx" 
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Message / Details</label>
                  <textarea 
                    id="form-message"
                    required 
                    rows={4}
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={formType === "contact" ? "Type details here..." : "Describe where, when and what you observed about the product..."}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none resize-none focus:border-[#0089C1] transition-colors"
                  />
                </div>

                <button
                  id="submit-support-btn"
                  type="submit"
                  className={`w-full py-3 rounded-full text-xs font-bold text-white transition-all shadow-sm ${
                    formType === "contact" 
                      ? "bg-[#0089C1] hover:bg-sky-600 shadow-sky-100" 
                      : "bg-red-500 hover:bg-red-600 shadow-red-100"
                  }`}
                >
                  {formType === "contact" ? "Send Message" : "Submit Anonymously"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-300/20 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto">
        <p>© 2026 AntiFakeNG Authenticity Platform. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/terms" className="hover:text-slate-800 cursor-pointer transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-slate-800 cursor-pointer transition-colors">Privacy Policy</Link>
          <Link href="/compliance" className="hover:text-slate-800 cursor-pointer transition-colors">Compliance Posture</Link>
        </div>
      </footer>

      {/* CHATBOT WIDGET */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Chat Window */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200/60 w-[320px] sm:w-[360px] h-[450px] flex flex-col mb-4 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-[#1E293B] px-5 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0089C1] flex items-center justify-center text-white">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-xs">AntiFakeNG Help Bot</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[9px] text-slate-300 font-semibold uppercase">Online assistant</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[#F8FAFC]">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`whitespace-pre-line max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-[#0089C1] text-white self-end rounded-tr-none" 
                        : "bg-white text-slate-700 border border-slate-100 self-start rounded-tl-none shadow-sm"
                    }`}
                  >
                    {renderMarkdown(msg.content)}
                  </div>
                ))}
                {chatLoading && (
                  <div className="bg-white text-slate-400 border border-slate-100 self-start rounded-2xl rounded-tl-none px-4 py-2.5 text-xs italic shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200"></span>
                    Thinking...
                  </div>
                )}
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-[#0089C1] transition-colors"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-4 rounded-xl text-xs transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="bg-[#0089C1] hover:bg-sky-600 text-white rounded-full p-4 shadow-xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 focus:outline-none"
        >
          {chatOpen ? (
            <IconX className="w-6 h-6" />
          ) : (
            <IconHeadphones className="w-6 h-6" />
          )}
        </button>
      </div>

    </div>
  );
}

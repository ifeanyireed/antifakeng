"use client";

import React from "react";
import Link from "next/link";
import { AhnaraButton } from "./AhnaraButton";

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
  </svg>
);

export const Footer = () => {
  const socials = [
    { icon: <TwitterIcon className="w-5 h-5" />, href: "#" },
    { icon: <InstagramIcon className="w-5 h-5" />, href: "#" },
    { icon: <FacebookIcon className="w-5 h-5" />, href: "#" },
    { icon: <LinkedinIcon className="w-5 h-5" />, href: "#" },
  ];

  return (
    <footer className="pt-24 pb-12 bg-ahnara-bg-base border-t-2 border-ahnara-brand/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <img src="/logo.png" alt="Ahnara Logo" className="w-8 h-8 object-contain" />
              <span className="text-xl font-bold text-display">Ahnara</span>
            </div>
            <p className="text-ahnara-text-secondary text-sm mb-6 leading-relaxed">
              Nigeria's #1 business discovery and conversion platform. Empowering local businesses and consumers through technology.
            </p>
            <div className="flex gap-4">
              {socials.map((social, i) => (
                <div key={i} className="w-10 h-10 rounded-full liquid-glass flex items-center justify-center cursor-pointer hover:bg-ahnara-brand hover:text-white transition-all">
                  {social.icon}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-display tracking-widest uppercase text-[10px]">Company</h4>
            <ul className="space-y-4 text-sm text-ahnara-text-secondary">
              <Link href="/about"><li className="hover:text-ahnara-brand cursor-pointer transition-colors">Our Story</li></Link>
              <Link href="/ahnara-verified"><li className="hover:text-ahnara-brand cursor-pointer transition-colors font-bold text-ahnara-amber">Ahnara Guaranteed</li></Link>
              <Link href="/trending"><li className="hover:text-ahnara-brand cursor-pointer transition-colors">Trending</li></Link>
              <Link href="/contact"><li className="hover:text-ahnara-brand cursor-pointer transition-colors">Contact & Support</li></Link>
              <Link href="/legal/privacy"><li className="hover:text-ahnara-brand cursor-pointer transition-colors">Privacy Policy</li></Link>
              <Link href="/legal/terms"><li className="hover:text-ahnara-brand cursor-pointer transition-colors">Terms of Service</li></Link>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-display tracking-widest uppercase text-[10px]">Business</h4>
            <ul className="space-y-4 text-sm text-ahnara-text-secondary">
              <Link href="/join">
                <li className="hover:text-ahnara-brand cursor-pointer transition-colors font-bold text-ahnara-brand">List your Business</li>
              </Link>
              <Link href="/business"><li className="hover:text-ahnara-brand cursor-pointer transition-colors">Enterprise Solutions</li></Link>
              <Link href="/business"><li className="hover:text-ahnara-brand cursor-pointer transition-colors">Advertising</li></Link>
              <Link href="/success-stories"><li className="hover:text-ahnara-brand cursor-pointer transition-colors">Success Stories</li></Link>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Newsletter</h4>
            <p className="text-sm text-ahnara-text-secondary mb-4">Get the best local deals and business tips delivered to you.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="email@ahnara.ng" className="flex-1 bg-ahnara-bg-surface border border-ahnara-border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ahnara-brand-glow" />
              <AhnaraButton size="sm">Join</AhnaraButton>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-ahnara-border text-xs text-ahnara-text-faint">
          <p>© 2026 Ahnara Technologies. All rights reserved.</p>
          <p className="mt-4 md:mt-0 flex items-center gap-1">Made with ❤️ for Nigeria 🇳🇬</p>
        </div>
      </div>
    </footer>
  );
};

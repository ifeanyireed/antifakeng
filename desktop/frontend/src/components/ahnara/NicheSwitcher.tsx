"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { AhnaraModal } from "./AhnaraModal";
import { AhnaraCard } from "./AhnaraCard";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface NicheInfo {
  id: string;
  name: string;
  tagline: string;
  color: string;
  icon: string;
  slug: string;
}

export const NICHES: NicheInfo[] = [
  // 01
  { id: "handyman-finders", name: "Handyman Finders", tagline: "Expert help for any task", color: "bg-home", icon: "/handyman.png", slug: "handyman-finders" },
  { id: "specialist-finders", name: "Specialist Finders", tagline: "Technical expert solutions", color: "bg-home", icon: "/specialist.png", slug: "specialist-finders" },
  { id: "sanitation-finders", name: "Sanitation Finders", tagline: "Professional cleaning help", color: "bg-home", icon: "/sanitation.png", slug: "sanitation-finders" },
  { id: "cleaning-finders", name: "Cleaning Finders", tagline: "Sparkling clean spaces", color: "bg-home", icon: "/sanitation.png", slug: "sanitation-finders" }, // Extra
  
  // 02
  { id: "style-finders", name: "Style Finders", tagline: "Bespoke fashion experts", color: "bg-fashion", icon: "/style.png", slug: "style-finders" },
  { id: "wardrobe-finders", name: "Wardrobe Finders", tagline: "Care for your apparel", color: "bg-fashion", icon: "/wardrobe.png", slug: "wardrobe-finders" },
  
  // 03
  { id: "tech-finders", name: "Tech Finders", tagline: "Innovative digital solutions", color: "bg-professionals", icon: "/tech.png", slug: "tech-finders" },
  { id: "corporate-finders", name: "Corporate Finders", tagline: "Trusted business advisors", color: "bg-professionals", icon: "/corporate.png", slug: "corporate-finders" },
  { id: "content-finders", name: "Content Finders", tagline: "Creative content creators", color: "bg-professionals", icon: "/content.png", slug: "content-finders" },
  
  // 04
  { id: "academic-finders", name: "Academic Finders", tagline: "Excellence in learning", color: "bg-education", icon: "/academic.png", slug: "academic-finders" },
  { id: "vocational-finders", name: "Vocational Finders", tagline: "Master new practical skills", color: "bg-education", icon: "/vocational.png", slug: "vocational-finders" },
  
  // 05
  { id: "planning-finders", name: "Planning Finders", tagline: "Perfectly orchestrated events", color: "bg-events", icon: "/planning.png", slug: "planning-finders" },
  { id: "entertainment-finders", name: "Entertainment Finders", tagline: "Vibrant event entertainment", color: "bg-events", icon: "/entertain.png", slug: "entertainment-finders" },
  { id: "talent-finders", name: "Talent Finders", tagline: "Connecting you with top talent", color: "bg-professionals", icon: "/talent.png", slug: "talent-finders" },
  
  // 06
  { id: "medical-finders", name: "Medical Finders", tagline: "Professional medical care", color: "bg-health", icon: "/medical.png", slug: "medical-finders" },
  { id: "wellness-finders", name: "Wellness Finders", tagline: "Holistic health & vitality", color: "bg-health", icon: "/wellness.png", slug: "wellness-finders" },
  { id: "care-finders", name: "Care Finders", tagline: "Compassionate care services", color: "bg-health", icon: "/care.png", slug: "care-finders" },
  { id: "pet-care-finders", name: "Pet Care Finders", tagline: "Loving care for your pets", color: "bg-health", icon: "/care.png", slug: "care-finders" }, // Extra
  
  // 07
  { id: "transport-finders", name: "Transport Finders", tagline: "Seamless travel solutions", color: "bg-logistics", icon: "/transport.png", slug: "transport-finders" },
  { id: "delivery-finders", name: "Delivery Finders", tagline: "Fast & reliable deliveries", color: "bg-logistics", icon: "/delivery.png", slug: "delivery-finders" },
  
  // 08
  { id: "repair-finders", name: "Repair Finders", tagline: "Expert auto repair help", color: "bg-auto", icon: "/repair.png", slug: "repair-finders" },
  { id: "auto-care-finders", name: "Auto Care Finders", tagline: "Pristine auto maintenance", color: "bg-auto", icon: "/auto-care.png", slug: "auto-care-finders" },
  
  // 09
  { id: "culinary-finders", name: "Culinary Finders", tagline: "Exquisite catering tastes", color: "bg-food", icon: "/culinary.png", slug: "culinary-finders" },
  { id: "agro-finders", name: "Agro Finders", tagline: "Sustainable farming help", color: "bg-food", icon: "/agro.png", slug: "agro-finders" },
  
  // 10
  { id: "property-finders", name: "Property Finders", tagline: "Find your perfect space", color: "bg-realestate", icon: "/property.png", slug: "property-finders" },
  { id: "building-finders", name: "Building Finders", tagline: "Expert construction partners", color: "bg-realestate", icon: "/building.png", slug: "building-finders" },
];

interface NicheSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NicheSwitcher = ({ isOpen, onClose }: NicheSwitcherProps) => {
  return (
    <AhnaraModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Switch Niche Hub" 
      className="max-w-[95vw] lg:max-w-7xl bg-white/85 backdrop-blur-xl border border-white/20"
      backdropClassName="bg-white/70 backdrop-blur-md"
    >
      <div className="overflow-x-auto py-12 no-scrollbar snap-x snap-mandatory -mx-6 px-12 scroll-edge-fade">
        <div className="grid grid-rows-2 grid-flow-col gap-6 min-w-full pb-4">
          {NICHES.map((niche, i) => (
            <motion.div
              key={niche.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.01 }}
              className="flex-shrink-0 w-52 snap-start"
            >
              <Link href={`/${niche.slug}`} onClick={onClose}>
                <AhnaraCard 
                  variant="interactive" 
                  padding="none" 
                  className="h-full group overflow-hidden border-none shadow-xl bg-ahnara-bg-base"
                >
                  <div className={cn("h-20 flex items-center justify-center relative", niche.color)}>
                    <img src={niche.icon} alt={niche.name} className="w-12 h-12 object-contain z-10 transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-[13px] mb-0.5 line-clamp-1 group-hover:text-ahnara-brand transition-colors tracking-tight">{niche.name.replace(/ Finders?$/, "")}</h3>
                    <p className="text-[9px] text-ahnara-text-secondary line-clamp-1 leading-relaxed font-medium uppercase tracking-wider">{niche.tagline}</p>
                    <div className="mt-2 flex items-center text-[9px] font-bold text-ahnara-brand opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                      EXPLORE <ArrowRight className="w-2.5 h-2.5 ml-1.5" />
                    </div>
                  </div>
                </AhnaraCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AhnaraModal>
  );
};

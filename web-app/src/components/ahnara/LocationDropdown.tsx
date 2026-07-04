"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronDown, Check, Search, Navigation, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, CITIES } from "./LocationContext";

export function LocationDropdown({ className, buttonClassName }: { className?: string; buttonClassName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { currentCity, setCurrentCity, currentArea, setCurrentArea, setUserCoords } = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [animateKey, setAnimateKey] = useState(0);

  const filteredCities = CITIES.filter((city) =>
    city.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Visual confirmation bounce on state change
  useEffect(() => {
    if (currentCity) {
      setAnimateKey((prev) => prev + 1);
    }
  }, [currentCity, currentArea]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleAutoDetect = () => {
    setIsDetecting(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
            );
            if (!res.ok) throw new Error("Reverse geocoding failed");
            const data = await res.json();
            const address = data.address || {};
            
            // Extract state/city & suburb/LGA
            const detectedState = address.state || address.city || address.town || "";
            const detectedArea = address.suburb || address.neighbourhood || address.quarter || address.city_district || address.county || address.village || "";
            
            const cityName = detectedState || "Nigeria";
            const areaName = detectedArea || "";

            let matchedCity = CITIES.find(
              c =>
                c.name.toLowerCase().includes(cityName.toLowerCase()) ||
                cityName.toLowerCase().includes(c.name.toLowerCase())
            );
            
            const finalCity = matchedCity || {
              name: cityName,
              slug: cityName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
              areas: areaName ? [areaName] : []
            };

            setCurrentCity(finalCity);
            setCurrentArea(areaName);
            setUserCoords([latitude, longitude]);
            triggerToast(`Auto-detected: ${finalCity.name}${areaName ? `, ${areaName}` : ""}`);
          } catch (err) {
            console.error(err);
            triggerToast("Location auto-detection failed. Please select manually.");
          } finally {
            setIsDetecting(false);
            setIsOpen(false);
          }
        },
        (error) => {
          setTimeout(async () => {
            console.warn("Browser geolocation denied/failed, attempting IP fallback...", error);
            try {
              const res = await fetch("https://ipapi.co/json/");
              if (res.ok) {
                const ipData = await res.json();
                if (ipData.latitude && ipData.longitude) {
                  const detectedCityName = ipData.city || "Lagos";
                  const matchedCity = CITIES.find(
                    c => c.name.toLowerCase().includes(detectedCityName.toLowerCase()) || 
                         detectedCityName.toLowerCase().includes(c.name.toLowerCase())
                  );
                  const finalCity = matchedCity || {
                    name: detectedCityName,
                    slug: detectedCityName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                    areas: []
                  };
                  setCurrentCity(finalCity);
                  setCurrentArea(finalCity.areas?.[0] || "");
                  setUserCoords([ipData.latitude, ipData.longitude]);
                  triggerToast(`Auto-detected (IP): ${finalCity.name}`);
                  setIsDetecting(false);
                  setIsOpen(false);
                  return;
                }
              }
            } catch (ipErr) {
              console.error("IP fallback failed:", ipErr);
            }
            
            triggerToast("Location auto-detection failed. Please select manually.");
            setIsDetecting(false);
            setIsOpen(false);
          }, 500);
        }
      );
    } else {
      setIsDetecting(false);
    }
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <motion.button
        key={animateKey}
        animate={{ scale: [1, 1.06, 0.98, 1] }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 liquid-glass rounded-full hover:border-ahnara-brand transition-all border border-slate-200/40 text-slate-800 shadow-sm",
          buttonClassName
        )}
      >
        <MapPin className="w-4 h-4 text-ahnara-brand animate-pulse" />
        <span className="text-sm font-bold">
          {currentCity.name}{currentArea ? `, ${currentArea}` : ""}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-current opacity-60 transition-transform", isOpen && "rotate-180")} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-2 left-0 w-72 bg-ahnara-bg-base border border-ahnara-border rounded-2xl shadow-2xl z-[500] overflow-hidden"
          >
            <div className="p-3 border-b border-ahnara-border">
              <div className="relative flex items-center bg-ahnara-bg-surface rounded-xl px-3 h-10 border border-ahnara-border">
                <Search className="w-4 h-4 text-ahnara-text-faint" />
                <input
                  type="text"
                  placeholder="Search city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-none outline-none w-full px-2 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 no-scrollbar">
              <button
                onClick={handleAutoDetect}
                disabled={isDetecting}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ahnara-brand/10 text-ahnara-brand transition-colors text-left mb-1 disabled:opacity-60"
              >
                {isDetecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4 animate-bounce" />
                )}
                <span className="text-xs font-extrabold uppercase tracking-wider">
                  {isDetecting ? "Detecting location..." : "Detect Location"}
                </span>
              </button>

              <div className="h-px bg-ahnara-border my-1 mx-2" />

              {filteredCities.map((city) => {
                const isSelectedCity = currentCity.slug === city.slug;
                
                return (
                  <button
                    key={city.slug}
                    onClick={() => {
                      setCurrentCity(city);
                      setCurrentArea(""); // Clear area/LGA when manually choosing city
                      setUserCoords(null); // Clear custom GPS coordinates when manually choosing city
                      setIsOpen(false);
                      triggerToast(`Location updated: ${city.name}`);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left mb-1 border font-bold text-sm",
                      isSelectedCity
                        ? "bg-ahnara-brand/5 border-ahnara-brand/20 text-ahnara-brand"
                        : "bg-transparent border-transparent hover:bg-ahnara-bg-surface text-ahnara-text-primary"
                    )}
                  >
                    <span>{city.name}</span>
                    {isSelectedCity && !currentArea && (
                      <Check className="w-4 h-4 text-ahnara-brand" />
                    )}
                  </button>
                );
              })}

              {filteredCities.length === 0 && (
                <div className="p-4 text-center text-xs text-ahnara-text-faint italic">
                  No cities found matching your search.
                </div>
              )}
            </div>

            <div className="p-3 bg-ahnara-bg-surface border-t border-ahnara-border">
              <p className="text-[10px] text-ahnara-text-faint font-bold text-center uppercase tracking-widest">
                More cities coming soon
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 right-6 bg-slate-900/95 backdrop-blur text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-[99999] border border-white/10"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
              ✓
            </div>
            <span className="text-xs font-extrabold tracking-tight">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

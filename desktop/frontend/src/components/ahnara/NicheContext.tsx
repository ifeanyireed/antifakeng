"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AhnaraMode } from "./AhnaraModeToggle";

export type NicheId = 
  | "home-services" 
  | "fashion" 
  | "professionals" 
  | "education" 
  | "events" 
  | "health" 
  | "logistics" 
  | "auto" 
  | "food" 
  | "realestate";

interface NicheContextType {
  mode: AhnaraMode;
  setMode: (mode: AhnaraMode) => void;
  currentNiche: NicheId | null;
  setCurrentNiche: (niche: NicheId | null) => void;
}

const NicheContext = createContext<NicheContextType | undefined>(undefined);

export const NicheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<AhnaraMode>("buyer");
  const [currentNiche, setCurrentNiche] = useState<NicheId | null>(null);

  useEffect(() => {
    const savedMode = localStorage.getItem("ahnara-mode") as AhnaraMode;
    if (savedMode) setModeState(savedMode);
  }, []);

  const setMode = (newMode: AhnaraMode) => {
    setModeState(newMode);
    localStorage.setItem("ahnara-mode", newMode);
  };

  return (
    <NicheContext.Provider value={{ mode, setMode, currentNiche, setCurrentNiche }}>
      {children}
    </NicheContext.Provider>
  );
};

export const useNiche = () => {
  const context = useContext(NicheContext);
  if (context === undefined) {
    throw new Error("useNiche must be used within a NicheProvider");
  }
  return context;
};

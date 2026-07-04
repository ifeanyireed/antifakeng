"use client";

import React from "react";

interface AhnaraLoaderProps {
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
}

export function AhnaraLoader({ fullScreen = false, size = "md" }: AhnaraLoaderProps) {
  // Dimensions mapping
  const dimensions = {
    sm: {
      outline: "w-[56px] h-[56px] border-2",
      logoBg: "w-10 h-10",
      logoImg: "w-6 h-6",
    },
    md: {
      outline: "w-[76px] h-[76px] border-2",
      logoBg: "w-14 h-14",
      logoImg: "w-9 h-9",
    },
    lg: {
      outline: "w-[110px] h-[110px] border-[3px]",
      logoBg: "w-20 h-20",
      logoImg: "w-13 h-13",
    },
  };

  const current = dimensions[size];

  const content = (
    <div className="relative flex items-center justify-center select-none pointer-events-none">
      {/* Rotating outline */}
      <div 
        className={`${current.outline} rounded-full border-t-[#0089C1] border-r-[#0089C1] border-b-[#0089C1]/10 border-l-[#0089C1]/10 animate-spin`} 
      />
      {/* Central Logo wrapped in circle */}
      <div className={`absolute ${current.logoBg} rounded-full bg-[#D4F475] flex items-center justify-center shadow-md`}>
        <img src="/logo.png" alt="Ahnara Logo" className={`${current.logoImg} object-contain`} />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full bg-[#E8EFF4] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

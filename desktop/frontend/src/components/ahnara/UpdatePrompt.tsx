"use client";

import React, { useEffect, useState } from "react";

export default function UpdatePrompt() {
  const [updateDetails, setUpdateDetails] = useState<any>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  useEffect(() => {
    const isWails = typeof window !== "undefined" && (window as any).go !== undefined;
    if (!isWails) return;

    // 1. Run version check on launch
    const checkUpdates = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.antifake.ng";
        const cleanBaseUrl = baseUrl.replace(/\/$/, "");
        const apiUrl = cleanBaseUrl.endsWith("/api") ? cleanBaseUrl : `${cleanBaseUrl}/api`;

        const update = await (window as any).go.main.App.CheckForUpdates(apiUrl);
        if (update) {
          setUpdateDetails(update);
        }
      } catch (err) {
        console.error("Failed to run desktop update check:", err);
      }
    };

    // Delay checking slightly to ensure app window is fully loaded
    const timer = setTimeout(checkUpdates, 2000);

    // 2. Listen for download progress updates from Go runtime EventsEmit
    const runtime = (window as any).runtime;
    if (runtime && runtime.EventsOn) {
      runtime.EventsOn("download-progress", (progress: number) => {
        setDownloadProgress(progress);
      });
    }

    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = async () => {
    if (!updateDetails) return;
    try {
      setDownloadProgress(0);
      
      // Determine correct URL based on user platform
      const ua = window.navigator.userAgent;
      let downloadUrl = updateDetails.windows_url;
      if (ua.indexOf("Macintosh") !== -1 || ua.indexOf("MacIntel") !== -1 || ua.indexOf("Mac OS X") !== -1) {
        downloadUrl = updateDetails.mac_url;
      }

      await (window as any).go.main.App.DownloadAndInstallUpdate(downloadUrl);
    } catch (err: any) {
      alert("Failed to install update:\n" + (err?.message || err));
      setDownloadProgress(null);
    }
  };

  if (!updateDetails) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col">
        {/* Top bar styling indicator */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500" />

        <h3 className="font-extrabold text-lg text-slate-900 mb-2 mt-2">New Update Available!</h3>
        <p className="text-xs text-slate-500 font-bold mb-4">
          A new version (<strong className="text-[#0089C1]">v{updateDetails.version}</strong>) is ready for download.
        </p>

        {/* Changelog Box */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold text-slate-600 mb-6 leading-relaxed max-h-40 overflow-y-auto">
          <h4 className="font-black text-slate-700 mb-1">What's New:</h4>
          <p>{updateDetails.changelog}</p>
        </div>

        {downloadProgress !== null ? (
          /* Download Progress Indicator */
          <div className="w-full">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              <span>Downloading update...</span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#0089C1] transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          /* Controls */
          <div className="flex gap-3">
            {!updateDetails.critical && (
              <button 
                onClick={() => setUpdateDetails(null)} 
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-2xl text-xs transition-all border border-slate-200/50"
              >
                Skip For Now
              </button>
            )}
            <button 
              onClick={handleUpdate} 
              className="flex-1 bg-[#0089C1] hover:bg-sky-600 text-white font-extrabold py-3 rounded-2xl text-xs transition-all shadow-md shadow-sky-100"
            >
              Update & Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

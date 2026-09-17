import React, { useState } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { sound } from '../utils/audio';
import {
  Download,
  Smartphone,
  CheckCircle2,
  WifiOff,
  Wifi,
  X,
  Share,
  PlusSquare,
  Sparkles,
} from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isOnline,
    triggerInstall,
    showIOSPrompt,
    setShowIOSPrompt,
  } = usePWAInstall();

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Offline / Online Status Indicator */}
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
            !isOnline
              ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
              : isInstalled
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-800/80 border-slate-700/60 text-slate-400'
          }`}
          title={
            !isOnline
              ? 'Offline mode active — All games and storage work 100% offline!'
              : isInstalled
              ? 'App installed & cached for offline play'
              : 'Offline-ready Progressive Web App'
          }
        >
          {!isOnline ? (
            <>
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span className="hidden xs:inline">Offline Mode</span>
            </>
          ) : isInstalled ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="hidden xs:inline">Offline Ready</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden xs:inline">Offline Ready</span>
            </>
          )}
        </div>

        {/* In-App Install Trigger Button */}
        {!isInstalled && (
          <button
            id="pwa-install-app-btn"
            onClick={() => {
              sound.playClick();
              triggerInstall();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            title="Install app on mobile or desktop for fullscreen offline play"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install App</span>
            <span className="sm:hidden">Install</span>
          </button>
        )}
      </div>

      {/* iOS Safari Guided Add-to-Home-Screen Modal */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-slate-100 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Smartphone className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Install on iPhone / iPad</h3>
                  <p className="text-[11px] text-slate-400">Play offline anytime like a native app</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSPrompt(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block mb-0.5">1. Tap the Share button</span>
                  <span className="text-slate-400">In Safari's bottom toolbar, tap the square share icon with arrow pointing up.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block mb-0.5">2. Tap 'Add to Home Screen'</span>
                  <span className="text-slate-400">Scroll down through the share sheet options and select <strong>Add to Home Screen</strong>.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block mb-0.5">3. Launch Fullscreen Offline</span>
                  <span className="text-slate-400">Tap <strong>Add</strong>. The game will now launch in fullscreen without any browser bars, even in airplane mode!</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSPrompt(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

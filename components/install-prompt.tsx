"use client";

import { useState, useEffect } from "react";
import { X, Share, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already dismissed or installed
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;

    if (dismissed || isStandalone) {
      return;
    }

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    const isAndroidDevice = /android/.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // For Android/Chrome - listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // For iOS - show after a delay
    if (isIOSDevice) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }

    // For other platforms, show after delay if no native prompt
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt && (isIOSDevice || isAndroidDevice)) {
        setShowPrompt(true);
      }
    }, 3000);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        localStorage.setItem("pwa-install-dismissed", "true");
      }
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "true");
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-gradient-to-br from-neutral-900 to-black border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-500">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
          aria-label="Schliessen"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#57ff55] to-[#4826ae] flex items-center justify-center shadow-lg shadow-[#57ff55]/20">
            <span className="text-3xl font-bold text-black">2H</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white text-center mb-2">
          App installieren
        </h2>
        <p className="text-white/60 text-center text-sm mb-6">
          Fuegen Sie Unger PhysioAssistent zu Ihrem Startbildschirm hinzu fuer
          schnellen Zugriff.
        </p>

        {/* Platform-specific instructions */}
        {isIOS ? (
          <div className="bg-white/5 rounded-2xl p-4 mb-6">
            <p className="text-white/80 text-sm mb-4 font-medium">
              So geht's auf iPhone/iPad:
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#57ff55]/20 flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4 text-[#57ff55]" />
                </div>
                <span className="text-white/70 text-sm">
                  Tippen Sie auf "Teilen"
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#57ff55]/20 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 text-[#57ff55]" />
                </div>
                <span className="text-white/70 text-sm">
                  Waehlen Sie "Zum Home-Bildschirm"
                </span>
              </div>
            </div>
          </div>
        ) : isAndroid && !deferredPrompt ? (
          <div className="bg-white/5 rounded-2xl p-4 mb-6">
            <p className="text-white/80 text-sm mb-4 font-medium">
              So geht's auf Android:
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#57ff55]/20 flex items-center justify-center shrink-0">
                  <MoreVertical className="w-4 h-4 text-[#57ff55]" />
                </div>
                <span className="text-white/70 text-sm">
                  Tippen Sie auf das Menue (3 Punkte)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#57ff55]/20 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 text-[#57ff55]" />
                </div>
                <span className="text-white/70 text-sm">
                  Waehlen Sie "Zum Startbildschirm"
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="flex-1 h-12 bg-transparent border-white/20 text-white hover:bg-white/10 rounded-xl"
          >
            Spaeter
          </Button>
          {deferredPrompt ? (
            <Button
              onClick={handleInstall}
              className="flex-1 h-12 bg-gradient-to-r from-[#57ff55] to-[#4826ae] text-black font-semibold hover:opacity-90 rounded-xl"
            >
              Installieren
            </Button>
          ) : (
            <Button
              onClick={handleDismiss}
              className="flex-1 h-12 bg-gradient-to-r from-[#57ff55] to-[#4826ae] text-black font-semibold hover:opacity-90 rounded-xl"
            >
              Verstanden
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

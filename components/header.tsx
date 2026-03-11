"use client";

import { Sparkles, Bell, BellOff, BellRing } from "lucide-react";
import { useNotifications } from "@/lib/notification-context";

export function Header() {
  const { permission, openPrompt } = useNotifications();

  const getNotificationIcon = () => {
    if (permission === "granted") {
      return <BellRing className="w-5 h-5" />;
    } else if (permission === "denied") {
      return <BellOff className="w-5 h-5" />;
    }
    return <Bell className="w-5 h-5" />;
  };

  const getNotificationColor = () => {
    if (permission === "granted") {
      return "bg-[#57ff55]/20 text-[#57ff55] border-[#57ff55]/30";
    } else if (permission === "denied") {
      return "bg-red-500/20 text-red-400 border-red-500/30";
    }
    return "bg-white/10 text-white/70 border-white/20";
  };

  const getTooltipText = () => {
    if (permission === "granted") {
      return "Benachrichtigungen aktiv";
    } else if (permission === "denied") {
      return "Benachrichtigungen blockiert";
    }
    return "Benachrichtigungen aktivieren";
  };

  const handleClick = () => {
    if (permission === "denied") {
      alert(
        "Benachrichtigungen wurden blockiert. Bitte aktivieren Sie diese in Ihren Browser-Einstellungen.",
      );
      return;
    }
    if (permission !== "granted") {
      openPrompt();
    }
  };

  return (
    <header className="bg-black text-white sticky top-0 z-10 pt-[env(safe-area-inset-top)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#57ff55] to-[#4826ae] flex items-center justify-center shadow-lg shadow-[#57ff55]/20">
            <Sparkles
              className="w-5 h-5 sm:w-6 sm:h-6 text-black"
              strokeWidth={2}
            />
          </div>
          <div>
            <h1 className="font-bold text-lg sm:text-xl tracking-tight">
              2HEAL
            </h1>
            <p className="text-xs sm:text-sm text-white/60 font-medium">
              PhysioAssistent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification Button */}
          <button
            onClick={handleClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200 hover:scale-105 active:scale-95 ${getNotificationColor()}`}
            title={getTooltipText()}
          >
            {getNotificationIcon()}
            <span className="hidden sm:inline text-sm font-medium">
              {permission === "granted"
                ? "Aktiv"
                : permission === "denied"
                  ? "Blockiert"
                  : "Aktivieren"}
            </span>
          </button>

          {/* Online Status */}
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#57ff55] animate-pulse" />
            <span className="text-sm text-white/80">Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}

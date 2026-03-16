"use client";

import { useState } from "react";
import {
  Sparkles,
  Bell,
  BellOff,
  BellRing,
  Copy,
  Check,
  X,
  LogOut,
} from "lucide-react";
import { useNotifications } from "@/lib/notification-context";
import Image from "next/image";

export function Header() {
  const { permission, fcmToken, openPrompt, disableNotifications } =
    useNotifications();
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToken = async () => {
    if (fcmToken) {
      await navigator.clipboard.writeText(fcmToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
    if (permission === "granted") {
      setShowTokenModal(true);
    } else {
      openPrompt();
    }
  };

  const handleDisable = async () => {
    await disableNotifications();
    setShowTokenModal(false);
    setShowDisableConfirm(false);
  };

  return (
    <header className="bg-black text-white sticky top-0 z-10 pt-[env(safe-area-inset-top)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            {/* App Icon */}
            <Image
              src="/icons/icon-256x256.png"
              alt="App Icon"
              width={40}
              height={40}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl shadow-lg"
            />

            {/* Firmenlogo */}
            <Image
              src="/2HEAL_complete_on_black.png"
              alt="Firmenlogo"
              width={180}
              height={40}
              className="h-10 sm:h-10 w-auto"
            />
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

      {/* FCM Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-bold text-lg">FCM Token</h3>
              <button
                onClick={() => setShowTokenModal(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <p className="text-sm text-white/60 mb-3">
                Push Token, den benötigst du nur wenn der Support danach fragt:
              </p>

              <div className="bg-black rounded-xl p-4 border border-white/10">
                <code className="text-xs text-[#57ff55] break-all select-all">
                  {fcmToken || "Kein Token verfügbar"}
                </code>
              </div>

              <button
                onClick={copyToken}
                disabled={!fcmToken}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#57ff55] to-[#4826ae] text-black font-bold transition-all hover:opacity-90 disabled:opacity-50"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Token kopieren
                  </>
                )}
              </button>

              <button
                onClick={() => setShowDisableConfirm(true)}
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-bold transition-all hover:bg-red-500/30"
              >
                <LogOut className="w-5 h-5" />
                Deaktivieren
              </button>
            </div>

            {/* Disable Confirmation */}
            {showDisableConfirm && (
              <div className="p-4 border-t border-white/10 bg-red-500/10">
                <p className="text-sm text-white/80 mb-3">
                  Benachrichtigungen wirklich deaktivieren?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDisable}
                    className="flex-1 py-2 px-3 rounded-lg bg-red-500/30 text-red-400 font-bold hover:bg-red-500/50 transition-colors"
                  >
                    Ja, deaktivieren
                  </button>
                  <button
                    onClick={() => setShowDisableConfirm(false)}
                    className="flex-1 py-2 px-3 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

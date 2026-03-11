"use client";

import { useEffect, useState } from "react";
import { X, Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/lib/notification-context";
import { onForegroundMessage } from "@/lib/firebase";

interface ForegroundNotification {
  id: string;
  title: string;
  body: string;
}

export function NotificationProvider() {
  const { showPrompt, closePrompt, enableNotifications, permission } =
    useNotifications();
  const [foregroundNotification, setForegroundNotification] =
    useState<ForegroundNotification | null>(null);

  useEffect(() => {
    if (permission !== "granted") return;

    let unsubscribe: (() => void) | undefined;

    const setupForegroundHandler = async () => {
      unsubscribe = await onForegroundMessage((payload: unknown) => {
        const typedPayload = payload as {
          notification?: { title?: string; body?: string };
        };
        setForegroundNotification({
          id: Date.now().toString(),
          title: typedPayload.notification?.title || "Unger",
          body: typedPayload.notification?.body || "",
        });

        setTimeout(() => {
          setForegroundNotification(null);
        }, 5000);
      });
    };

    setupForegroundHandler();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [permission]);

  const handleEnableNotifications = async () => {
    await enableNotifications();
  };

  const handleDismissPrompt = () => {
    localStorage.setItem("Unger_notification_prompted", "true");
    closePrompt();
  };

  const dismissForegroundNotification = () => {
    setForegroundNotification(null);
  };

  return (
    <>
      {/* Permission Prompt */}
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#57ff55] to-[#4826ae] flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6 text-black" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">
                  Benachrichtigungen aktivieren
                </h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Erhalten Sie wichtige Updates zu Terminen, Tipps und
                  Neuigkeiten von Unger.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleEnableNotifications}
                    className="flex-1 bg-[#57ff55] text-black hover:bg-[#4de64b] font-semibold"
                  >
                    Aktivieren
                  </Button>
                  <Button
                    onClick={handleDismissPrompt}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Später
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Foreground Notification Toast */}
      {foregroundNotification && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#57ff55] to-[#4826ae] flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white truncate">
                  {foregroundNotification.title}
                </h4>
                <p className="text-sm text-zinc-400 line-clamp-2">
                  {foregroundNotification.body}
                </p>
              </div>
              <button
                onClick={dismissForegroundNotification}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  requestNotificationPermission,
  onForegroundMessage,
} from "@/lib/firebase";

interface ForegroundNotification {
  id: string;
  title: string;
  body: string;
}

export function NotificationProvider() {
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null,
  );
  const [showPrompt, setShowPrompt] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [foregroundNotification, setForegroundNotification] =
    useState<ForegroundNotification | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("Notification" in window)) return;

    setPermission(Notification.permission);

    const hasBeenPrompted = localStorage.getItem("2heal_notification_prompted");

    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;

    console.log("hasBeenPrompted:", hasBeenPrompted);
    console.log("Notification.permission:", Notification.permission);
    console.log("isStandalone:", isStandalone);

    if (
      !hasBeenPrompted &&
      (Notification.permission === "default" ||
        Notification.permission === "denied")
    ) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);

      return () => clearTimeout(timer);
    }

    if (Notification.permission === "granted") {
      initializeNotifications();
    }
  }, []);

  const initializeNotifications = useCallback(async () => {
    try {
      // Service Worker registrieren
      let registration: ServiceWorkerRegistration | undefined;

      if ("serviceWorker" in navigator) {
        registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
        );

        await navigator.serviceWorker.ready;

        console.log("Service Worker registered:", registration);
      }

      // Token holen
      const token = await requestNotificationPermission();

      if (token) {
        setFcmToken(token);

        console.log("FCM Token:", token);

        // Hier könntest du den Token an dein Backend senden
        // await saveToken(token)
      }

      // Foreground Listener
      const unsubscribe = await onForegroundMessage((payload: unknown) => {
        const typedPayload = payload as {
          notification?: { title?: string; body?: string };
        };

        setForegroundNotification({
          id: Date.now().toString(),
          title: typedPayload.notification?.title || "2HEAL",
          body: typedPayload.notification?.body || "",
        });

        setTimeout(() => {
          setForegroundNotification(null);
        }, 5000);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Notification initialization failed:", error);
    }
  }, []);

  const handleEnableNotifications = async () => {
    localStorage.setItem("2heal_notification_prompted", "true");

    setShowPrompt(false);

    const unsubscribe = await initializeNotifications();

    setPermission(Notification.permission);

    return unsubscribe;
  };

  const handleDismissPrompt = () => {
    localStorage.setItem("2heal_notification_prompted", "true");
    setShowPrompt(false);
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
                  Neuigkeiten von 2HEAL.
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

      {fcmToken && <div className="hidden">FCM Token available</div>}
    </>
  );
}

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
    console.log("check for propmting");
    if (typeof window === "undefined") return;

    // Check if notifications are supported
    if (!("Notification" in window)) return;

    // Check current permission
    setPermission(Notification.permission);

    // Check if user has already been prompted
    const hasBeenPrompted = localStorage.getItem("2heal_notification_prompted");
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;

    console.log("hasBeenPrompted: " + hasBeenPrompted);
    console.log("Notification.permission: " + Notification.permission);
    console.log("isStandalone: " + isStandalone);

    // Show prompt after a delay if not prompted before and app is installed
    if (
      !hasBeenPrompted &&
      (Notification.permission === "default" ||
        Notification.permission === "denied")
    ) {
      console.log("SHOW PROMPT");
      const timer = setTimeout(() => {
        if (isStandalone) {
          console.log("SHOW NOW");
          setShowPrompt(true);
        } else {
          setShowPrompt(true);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }

    // If already granted, get token and setup listener
    if (Notification.permission === "granted") {
      initializeNotifications();
    }
  }, []);

  const initializeNotifications = useCallback(async () => {
    // Register Firebase messaging service worker
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
        );

        // Send Firebase config to service worker
        registration.active?.postMessage({
          type: "FIREBASE_CONFIG",
          config: {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId:
              process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          },
        });
      } catch (error) {
        console.error("Firebase SW registration failed:", error);
      }
    }

    const token = await requestNotificationPermission();
    if (token) {
      setFcmToken(token);
      // Here you could send the token to your backend to store it
      console.log("FCM Token for Firebase Console:", token);
    }

    // Listen for foreground messages
    const unsubscribe = onForegroundMessage((payload: unknown) => {
      const typedPayload = payload as {
        notification?: { title?: string; body?: string };
      };
      setForegroundNotification({
        id: Date.now().toString(),
        title: typedPayload.notification?.title || "2HEAL",
        body: typedPayload.notification?.body || "",
      });

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setForegroundNotification(null);
      }, 5000);
    });

    return unsubscribe;
  }, []);

  const handleEnableNotifications = async () => {
    localStorage.setItem("2heal_notification_prompted", "true");
    setShowPrompt(false);

    await initializeNotifications();
    setPermission(Notification.permission);
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

      {/* Debug: Show FCM Token in console */}
      {fcmToken && (
        <div className="hidden">FCM Token available - check console</div>
      )}
    </>
  );
}

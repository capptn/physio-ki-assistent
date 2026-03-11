"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import {
  requestNotificationPermission,
  onForegroundMessage,
  isMessagingSupported,
} from "@/lib/firebase";

interface NotificationContextType {
  permission: NotificationPermission | "unsupported" | null;
  fcmToken: string | null;
  showPrompt: boolean;
  openPrompt: () => void;
  closePrompt: () => void;
  enableNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationContextProvider",
    );
  }
  return context;
}

export function NotificationContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported" | null
  >(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  const initializeNotifications = useCallback(async () => {
    const supported = await isMessagingSupported();
    if (!supported) {
      setPermission("unsupported");
      return;
    }

    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
        );

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
      console.log("FCM Token for Firebase Console:", token);
    }

    await onForegroundMessage(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkSupport = async () => {
      const supported = await isMessagingSupported();
      if (!supported) {
        setPermission("unsupported");
        return;
      }

      if ("Notification" in window) {
        setPermission(Notification.permission);

        if (Notification.permission === "granted") {
          initializeNotifications();
        }
      }
    };

    checkSupport();
  }, [initializeNotifications]);

  const openPrompt = useCallback(() => {
    setShowPrompt(true);
  }, []);

  const closePrompt = useCallback(() => {
    setShowPrompt(false);
  }, []);

  const enableNotifications = useCallback(async () => {
    localStorage.setItem("2heal_notification_prompted", "true");
    setShowPrompt(false);
    await initializeNotifications();
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, [initializeNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        permission,
        fcmToken,
        showPrompt,
        openPrompt,
        closePrompt,
        enableNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

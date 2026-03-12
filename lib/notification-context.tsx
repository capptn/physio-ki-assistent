"use client";

// Notification context for managing push notification state
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { isMessagingSupported } from "@/lib/firebase";

interface NotificationContextType {
  permission: NotificationPermission | "unsupported" | null;
  fcmToken: string | null;
  showPrompt: boolean;
  openPrompt: () => void;
  closePrompt: () => void;
  enableNotifications: () => Promise<void>;
  disableNotifications: () => Promise<void>;
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

  // Register SW and set up foreground listener — does NOT request permission
  const setupMessaging = useCallback(async (): Promise<
    (() => void) | undefined
  > => {
    const supported = await isMessagingSupported();
    if (!supported) return undefined;

    if ("serviceWorker" in navigator) {
      try {
        const swUrl = new URL(
          "/firebase-messaging-sw.js",
          window.location.origin,
        );
        swUrl.searchParams.set(
          "apiKey",
          process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
        );
        swUrl.searchParams.set(
          "authDomain",
          process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
        );
        swUrl.searchParams.set(
          "projectId",
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
        );
        swUrl.searchParams.set(
          "storageBucket",
          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
        );
        swUrl.searchParams.set(
          "messagingSenderId",
          process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
        );
        swUrl.searchParams.set(
          "appId",
          process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
        );
        await navigator.serviceWorker.register(swUrl.toString());
      } catch (error) {
        console.error("Firebase SW registration failed:", error);
      }
    }

    const token = await import("@/lib/firebase").then((m) => m.getFCMToken());
    if (token) setFcmToken(token);

    // Foreground messages are handled by NotificationProvider
    return undefined;
  }, []);

  // On mount: check support + permission, auto-setup if already granted
  useEffect(() => {
    if (typeof window === "undefined") return;

    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      // Check if user has manually disabled notifications
      const isDisabled =
        localStorage.getItem("2heal_notifications_disabled") === "true";
      if (isDisabled) {
        setPermission("default" as NotificationPermission);
        return;
      }

      const supported = await isMessagingSupported();
      if (!supported) {
        setPermission("unsupported");
        return;
      }

      if (!("Notification" in window)) {
        setPermission("unsupported");
        return;
      }

      const currentPermission = Notification.permission;
      setPermission(currentPermission);

      // Only setup messaging if permission is already granted (no prompt needed)
      if (currentPermission === "granted") {
        unsubscribe = await setupMessaging();
      }
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [setupMessaging]);

  const openPrompt = useCallback(() => {
    setShowPrompt(true);
  }, []);

  const closePrompt = useCallback(() => {
    setShowPrompt(false);
  }, []);

  // Called only from an explicit user gesture (button click)
  const enableNotifications = useCallback(async () => {
    localStorage.setItem("2heal_notification_prompted", "true");
    localStorage.removeItem("2heal_notifications_disabled");
    setShowPrompt(false);

    // requestPermission MUST be called directly here (user gesture context)
    const perm = await Notification.requestPermission();
    setPermission(perm);

    if (perm === "granted") {
      await setupMessaging();
    }
  }, [setupMessaging]);

  // Disable notifications and unsubscribe from Firebase
  const disableNotifications = useCallback(async () => {
    setFcmToken(null);

    // Set disabled flag - this persists across refreshes
    localStorage.setItem("2heal_notifications_disabled", "true");
    localStorage.removeItem("2heal_notification_prompted");

    // Unregister all service workers
    if ("serviceWorker" in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      } catch (error) {
        console.error("Error unregistering SW:", error);
      }
    }

    // Clear IndexedDB firebase-messaging-store
    try {
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (db.name && db.name.includes("firebase")) {
          indexedDB.deleteDatabase(db.name);
        }
      }
    } catch (error) {
      // indexedDB.databases() not supported in all browsers
    }

    // Reset permission state to 'default' so the prompt will show again if needed
    setPermission("default" as NotificationPermission);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        permission,
        fcmToken,
        showPrompt,
        openPrompt,
        closePrompt,
        enableNotifications,
        disableNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

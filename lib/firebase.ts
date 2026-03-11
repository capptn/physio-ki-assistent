"use client";

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  Messaging,
  isSupported,
} from "firebase/messaging";

// Check if Firebase Messaging is supported in the current browser
export async function isMessagingSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("PushManager" in window)) return false;

  try {
    return await isSupported();
  } catch {
    return false;
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let messaging: Messaging | undefined;

export function getFirebaseApp() {
  if (typeof window === "undefined") return undefined;

  if (!app && getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else if (!app) {
    app = getApps()[0];
  }

  return app;
}

export async function getFirebaseMessaging(): Promise<Messaging | undefined> {
  if (typeof window === "undefined") return undefined;

  const supported = await isMessagingSupported();
  if (!supported) {
    console.log("Firebase Messaging is not supported in this browser");
    return undefined;
  }

  const app = getFirebaseApp();
  if (!app) return undefined;

  if (!messaging) {
    try {
      messaging = getMessaging(app);
    } catch (error) {
      console.error("Firebase Messaging not supported:", error);
      return undefined;
    }
  }

  return messaging;
}

// Get FCM token WITHOUT requesting permission — only call when permission is already granted
export async function getFCMToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  try {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

// Legacy: requests permission AND gets token — only call from a user gesture
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const supported = await isMessagingSupported();
  if (!supported) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  return getFCMToken();
}

export async function onForegroundMessage(
  callback: (payload: unknown) => void,
): Promise<() => void> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);
    callback(payload);
  });
}

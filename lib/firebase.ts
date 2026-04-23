"use client";

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  deleteToken,
  onMessage,
  Messaging,
  isSupported,
} from "firebase/messaging";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  Auth,
} from "firebase/auth";

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
let auth: Auth | undefined;

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

// Suppress Firebase Messaging's internal console.warn for a single async
// operation. Firebase logs a noisy warning before rethrowing errors like
// "token-unsubscribe-failed" — we handle those errors explicitly, so the
// warning is just noise.
async function withSuppressedFcmWarnings<T>(fn: () => Promise<T>): Promise<T> {
  const origWarn = console.warn;
  const origError = console.error;
  const shouldSuppress = (args: unknown[]) => {
    const first = args[0];
    const text = typeof first === "string" ? first : String(first ?? "");
    return (
      text.includes("token-unsubscribe-failed") ||
      text.includes("token-subscribe-failed") ||
      text.includes("A problem occurred while unsubscribing") ||
      text.includes("A problem occurred while subscribing")
    );
  };
  console.warn = (...args: unknown[]) => {
    if (shouldSuppress(args)) return;
    origWarn.apply(console, args as []);
  };
  console.error = (...args: unknown[]) => {
    if (shouldSuppress(args)) return;
    origError.apply(console, args as []);
  };
  try {
    return await fn();
  } finally {
    console.warn = origWarn;
    console.error = origError;
  }
}

// Get FCM token WITHOUT requesting permission — only call when permission is already granted.
// Pass the ServiceWorkerRegistration after it is *active* (e.g. via navigator.serviceWorker.ready)
// to avoid: "Subscription failed - no active Service Worker".
export async function getFCMToken(
  serviceWorkerRegistration?: ServiceWorkerRegistration,
): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  try {
    return await withSuppressedFcmWarnings(() =>
      getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration,
      }),
    );
  } catch (error) {
    const code = (error as { code?: string } | null)?.code ?? "";
    const message = String(error);

    // Case 1: Stale FCM registration on the server — Firebase's refresh path
    // hits HTTP 400 because the old token no longer exists server-side.
    const isStale =
      code === "messaging/token-unsubscribe-failed" ||
      code === "messaging/token-subscribe-failed" ||
      message.includes("token-unsubscribe-failed");

    if (isStale && serviceWorkerRegistration) {
      console.warn(
        "FCM token appears stale — clearing Firebase's token and retrying...",
      );

      // Let Firebase clean up its own IndexedDB via its public API.
      // This avoids dangling IDBDatabase handles inside the SDK.
      try {
        await withSuppressedFcmWarnings(() => deleteToken(messaging));
      } catch {
        // deleteToken itself may 400 on the FCM server. We don't care — the
        // local IDB entry is still removed, which is what we need.
      }

      // Also drop the PushManager subscription so getToken() will fully
      // re-subscribe on the next attempt.
      try {
        const sub =
          await serviceWorkerRegistration.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      } catch (e) {
        console.warn("Failed to unsubscribe stale push subscription:", e);
      }

      try {
        return await withSuppressedFcmWarnings(() =>
          getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration,
          }),
        );
      } catch (retryError) {
        console.error("Error getting FCM token after retry:", retryError);
        return null;
      }
    }

    // Case 2: Firebase's in-memory IDBDatabase handle is corrupt (e.g. the DB
    // was deleted beneath the SDK). Only a fresh page load can rebuild the
    // handle. Do a one-shot reload, guarded by a flag to prevent loops.
    const isIdbCorruption =
      error instanceof DOMException &&
      error.name === "NotFoundError" &&
      message.includes("object stores was not found");

    if (isIdbCorruption) {
      const RELOAD_FLAG = "2heal_fcm_reload_attempted";
      const alreadyTried = sessionStorage.getItem(RELOAD_FLAG) === "1";
      if (!alreadyTried) {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        console.warn(
          "Firebase IndexedDB handle is corrupt — reloading once to recover.",
        );
        // Best-effort cleanup before reload. No await on deleteDatabase —
        // the reload itself closes any open handles.
        try {
          indexedDB.deleteDatabase("firebase-messaging-database");
        } catch {
          /* ignore */
        }
        window.location.reload();
        return null;
      }
      sessionStorage.removeItem(RELOAD_FLAG);
    }

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
    callback(payload);
  });
}

// Auth functions
export function getFirebaseAuth(): Auth | undefined {
  if (typeof window === "undefined") return undefined;

  const app = getFirebaseApp();
  if (!app) return undefined;

  if (!auth) {
    auth = getAuth(app);
  }

  return auth;
}

export async function signUp(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Auth not initialized");

  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Auth not initialized");

  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;

  await firebaseSignOut(auth);
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Auth not initialized");

  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export function onAuthChange(
  callback: (user: User | null) => void,
): () => void {
  const auth = getFirebaseAuth();
  if (!auth) return () => {};

  return onAuthStateChanged(auth, callback);
}

export type { User };

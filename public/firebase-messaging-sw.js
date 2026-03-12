// Firebase Messaging Service Worker
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js",
);

// Initialize Firebase directly in service worker
// Note: These values are public and safe to include in client-side code
const firebaseConfig = {
  apiKey: "AIzaSyExample", // Will be replaced by actual config
  authDomain: "example.firebaseapp.com",
  projectId: "example",
  storageBucket: "example.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};

// Try to get config from query params (set during registration)
const urlParams = new URLSearchParams(self.location.search);
if (urlParams.has("apiKey")) {
  firebaseConfig.apiKey = urlParams.get("apiKey");
  firebaseConfig.authDomain = urlParams.get("authDomain");
  firebaseConfig.projectId = urlParams.get("projectId");
  firebaseConfig.storageBucket = urlParams.get("storageBucket");
  firebaseConfig.messagingSenderId = urlParams.get("messagingSenderId");
  firebaseConfig.appId = urlParams.get("appId");
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const notificationTitle =
    payload.notification?.title || "2HEAL Physiotherapie";
  const notificationOptions = {
    body: payload.notification?.body || "Sie haben eine neue Nachricht",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: payload.data?.tag || "default",
    data: payload.data,
    vibrate: [100, 50, 100],
    actions: [
      {
        action: "open",
        title: "Öffnen",
      },
      {
        action: "close",
        title: "Schließen",
      },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});

// Push events are handled by Firebase messaging.onBackgroundMessage above
// No need for a separate push handler to avoid duplicate notifications

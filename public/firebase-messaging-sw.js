// Firebase Messaging Service Worker
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js",
);

// Firebase config will be injected via postMessage from the main app
let firebaseConfig = null;

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "FIREBASE_CONFIG") {
    firebaseConfig = event.data.config;
    initializeFirebase();
  }
});

function initializeFirebase() {
  if (!firebaseConfig) return;

  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log("Background message received:", payload);

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
}

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});

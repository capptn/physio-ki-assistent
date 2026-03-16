import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PWARegister } from "@/components/pwa-register";
import { InstallPrompt } from "@/components/install-prompt";
import { NotificationProvider } from "@/components/notification-provider";
import { NotificationContextProvider } from "@/lib/notification-context";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Unger PhysioAssistent",
  description: "Ihr KI-Assistent für Physiotherapie-Fragen - Unger Praxis",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Unger",
  },
  formatDetection: {
    telephone: true,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#000000" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="bg-black">
      <body className={`${roboto.variable} font-sans antialiased bg-black`}>
        <AuthProvider>
          <NotificationContextProvider>
            {children}
            <InstallPrompt />
            <NotificationProvider />
          </NotificationContextProvider>
        </AuthProvider>
        <PWARegister />

        <Analytics />
      </body>
    </html>
  );
}

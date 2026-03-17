"use client";

import { Header } from "@/components/header";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/lib/auth-context";
import { MessageSquare, Dumbbell, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

function DashboardContent() {
  const { isSubscribed } = useAuth();

  return (
    <main className="flex flex-col min-h-dvh bg-black">
      <Header />

      <div className="flex-1 p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Willkommen bei 2HEAL
            </h1>
            <p className="text-white/70">Wähle einen Bereich um zu starten</p>
          </div>

          {/* Feature Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Chatbot Card - Requires Subscription */}
            <Link
              href={isSubscribed ? "/chat" : "/subscription"}
              className="group relative bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                {!isSubscribed && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium">
                    <Lock className="w-3 h-3" />
                    Abo erforderlich
                  </div>
                )}
                {isSubscribed && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                    Aktiv
                  </div>
                )}
              </div>

              <h2 className="text-xl font-semibold text-white mb-2">
                PhysioAssistent
              </h2>
              <p className="text-white/70 text-sm mb-4">
                Dein persoenlicher KI-Assistent für Physiotherapie. Erhalte
                individülle Beratung und Übungsempfehlungen.
              </p>

              <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                {isSubscribed ? "Zum Chat" : "Abo abschliessen"}
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Mini Training Plans Card - Free for logged in users */}
            <Link
              href="/training"
              className="group relative bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-primary" />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                  Kostenlos
                </div>
              </div>

              <h2 className="text-xl font-semibold text-white mb-2">
                Mini Trainingspläne
              </h2>
              <p className="text-white/70 text-sm mb-4">
                Kurze, effektive Trainingspläne für verschiedene
                Koerperbereiche. Perfekt für zwischendurch.
              </p>

              <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                Zu den Plänen
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Subscription Info */}
          {!isSubscribed && (
            <div className="mt-8 p-4 bg-[#1a1a1a] border border-white/10 rounded-xl">
              <p className="text-sm text-white">
                <span className="font-medium">Tipp:</span> Mit dem
                PhysioAssistent-Abo für nur 9,99 Euro/Monat erhältst du
                unbegrenzten Zugang zum KI-Chatbot mit personalisierten
                Empfehlungen.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

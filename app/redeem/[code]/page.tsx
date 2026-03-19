"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2, CheckCircle, XCircle, LogIn } from "lucide-react";
import Link from "next/link";

type RedeemStatus = "loading" | "success" | "error" | "not-logged-in";

export default function RedeemPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] = useState<RedeemStatus>("loading");
  const [message, setMessage] = useState("");
  const [planText, setPlanText] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStatus("not-logged-in");
      return;
    }

    // Redeem the code
    const redeemCode = async () => {
      try {
        const response = await fetch("/api/training/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, userId: user.uid }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message);
          setPlanText(data.trainingCode?.text || "");
        } else {
          setStatus("error");
          setMessage(data.error);

          // If already owned, still show the plan
          if (data.alreadyOwned) {
            setStatus("success");
            setMessage("Dieser Trainingsplan gehört bereits zu dir");
          }
        }
      } catch (error) {
        setStatus("error");
        setMessage("Verbindungsfehler. Bitte versuche es erneut.");
      }
    };

    redeemCode();
  }, [code, user, authLoading]);

  // Not logged in
  if (status === "not-logged-in") {
    return (
      <main className="min-h-dvh bg-black flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Anmeldung erforderlich
          </h1>
          <p className="text-white/60 mb-6">
            Um diesen Trainingsplan einzulösen, musst du dich zuerst anmelden
            oder registrieren.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={`/login?redirect=/redeem/${code}`}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#57ff55] to-[#4826ae] text-black font-bold text-center hover:opacity-90 transition-opacity"
            >
              Anmelden
            </Link>
            <Link
              href={`/register?redirect=/redeem/${code}`}
              className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-center hover:bg-white/20 transition-colors"
            >
              Registrieren
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Loading
  if (status === "loading" || authLoading) {
    return (
      <main className="min-h-dvh bg-black flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#57ff55] animate-spin mx-auto mb-4" />
          <p className="text-white/60">Trainingsplan wird eingelöst...</p>
        </div>
      </main>
    );
  }

  // Success
  if (status === "success") {
    return (
      <main className="min-h-dvh bg-black flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#57ff55]/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-[#57ff55]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Erfolgreich eingelöst
          </h1>
          <p className="text-white/60 mb-6">{message}</p>

          {planText && (
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-white/80 whitespace-pre-wrap">
                {planText}
              </p>
            </div>
          )}

          <Link
            href="/training"
            className="inline-block w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#57ff55] to-[#4826ae] text-black font-bold text-center hover:opacity-90 transition-opacity"
          >
            Zu meinen Trainingsplänen
          </Link>
        </div>
      </main>
    );
  }

  // Error
  return (
    <main className="min-h-dvh bg-black flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Fehler</h1>
        <p className="text-white/60 mb-6">{message}</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-colors"
          >
            Erneut versuchen
          </button>
          <Link
            href="/"
            className="w-full py-3 px-4 rounded-xl bg-white/5 text-white/60 font-medium text-center hover:bg-white/10 transition-colors"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </main>
  );
}

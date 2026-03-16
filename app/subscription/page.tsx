"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Sparkles, Check, Loader2, AlertCircle } from "lucide-react";

// Set to false for production
const ENABLE_TEST_MODE = true;

export default function SubscriptionPage() {
  const { user, loading, createCheckout, subscriptionLoading, error } =
    useAuth();
  const router = useRouter();
  const [localError, setLocalError] = useState<string | null>(null);
  const [showTestMode, setShowTestMode] = useState(false);

  // Only show test mode after hydration to avoid SSR mismatch
  useEffect(() => {
    if (ENABLE_TEST_MODE) {
      setShowTestMode(true);
    }
  }, []);

  const handleCheckout = async () => {
    try {
      setLocalError(null);
      const checkout = await createCheckout();
      

      // SumUp returns hosted_checkout_url when hosted_checkout is enabled
      if (checkout.hosted_checkout_url) {
        window.location.href = checkout.hosted_checkout_url;
      } else {
        setLocalError("Checkout-URL nicht erhalten");
      }
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Fehler beim Checkout",
      );
    }
  };

  return (
    <main className="min-h-dvh bg-black flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Sparkles className="w-16 h-16 text-[#57ff55]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            PhysioAssistent+
          </h1>
          <p className="text-white/60">Unlimited Chat Zugang</p>
        </div>

        {/* Price Card */}
        <div className="bg-gradient-to-br from-[#57ff55]/10 to-[#4826ae]/10 border border-[#57ff55]/30 rounded-2xl p-8 mb-6">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-white mb-2">
              9,99€
              <span className="text-lg text-white/60 font-normal">/Monat</span>
            </div>
          </div>

          {/* Features */}
          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3 text-white/80">
              <Check className="w-5 h-5 text-[#57ff55]" />
              <span>Unbegrenzter Chat Zugang</span>
            </li>
            <li className="flex items-center gap-3 text-white/80">
              <Check className="w-5 h-5 text-[#57ff55]" />
              <span>Personalisierte Übungen</span>
            </li>
            <li className="flex items-center gap-3 text-white/80">
              <Check className="w-5 h-5 text-[#57ff55]" />
              <span>Push Benachrichtigungen</span>
            </li>
            <li className="flex items-center gap-3 text-white/80">
              <Check className="w-5 h-5 text-[#57ff55]" />
              <span>Monatliche Abrechnung</span>
            </li>
          </ul>

          {/* Error */}
          {(error || localError) && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error || localError}
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={subscriptionLoading || loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#57ff55] to-[#4826ae] text-black font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {subscriptionLoading || loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {loading ? "Sitzung wird geladen..." : "Wird geladen..."}
              </>
            ) : (
              <>Jetzt zahlen</>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="text-center text-white/60 text-sm space-y-2">
          <p>Sicher bezahlt durch SumUp</p>
          <p className="text-white/40">
            Alle Preise inkl. MwSt. | Jederzeit kündbar
          </p>
        </div>

        {/* Test Mode - Set ENABLE_TEST_MODE to false for Production */}
        {showTestMode && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-yellow-500 text-xs text-center mb-3">
              Test-Modus (nur in Entwicklung)
            </p>
            <button
              onClick={() => router.push("/subscription/success?test=true")}
              className="w-full py-2 px-4 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 text-sm font-medium hover:bg-yellow-500/30 transition-colors"
            >
              Zahlung simulieren
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

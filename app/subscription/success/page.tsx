"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activateSubscription } = useAuth();
  const [status, setStatus] = useState<"checking" | "success" | "error">(
    "checking",
  );

  useEffect(() => {
    const checkStatus = async () => {
      const checkoutId = searchParams.get("checkout_id");
      const isTest = searchParams.get("test") === "true";

      // Test mode - simulate successful payment
      if (isTest) {
        activateSubscription();
        setStatus("success");
        setTimeout(() => router.push("/"), 3000);
        return;
      }

      if (!checkoutId) {
        setStatus("error");
        return;
      }

      try {
        const response = await fetch(
          `/api/subscription/status?checkoutId=${checkoutId}`,
        );
        const data = await response.json();

        if (data.status === "PAID") {
          activateSubscription();
          setStatus("success");
          setTimeout(() => router.push("/"), 3000);
        } else {
          setStatus("error");
        }
      } catch (error) {
        setStatus("error");
      }
    };

    checkStatus();
  }, [searchParams, router]);

  return (
    <main className="min-h-dvh bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === "checking" && (
          <>
            <Loader2 className="w-16 h-16 text-[#57ff55] animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white">
              Zahlung wird überprüft...
            </h1>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#57ff55]/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-[#57ff55]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Zahlung erfolgreich!
            </h1>
            <p className="text-white/60 mb-4">
              Du hast Zugang zu PhysioAssistent+ erhalten.
            </p>
            <p className="text-white/40 text-sm">Weiterleitung zur App...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Zahlung nicht erfolgreich
            </h1>
            <p className="text-white/60 mb-6">
              Die Zahlung konnte nicht abgeschlossen werden.
            </p>
            <button
              onClick={() => router.push("/subscription")}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#57ff55] to-[#4826ae] text-black font-bold"
            >
              Erneut versuchen
            </button>
          </>
        )}
      </div>
    </main>
  );
}

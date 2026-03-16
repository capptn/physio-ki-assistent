"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user, isSubscribed, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // For now, redirect to subscription page if not subscribed
    // In production, you'd check subscription status from backend
    if (!loading && user && !isSubscribed) {
      router.push("/subscription");
    }
  }, [user, isSubscribed, loading, router]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#57ff55] animate-spin" />
      </div>
    );
  }

  if (!isSubscribed && user) {
    return null;
  }

  return <>{children}</>;
}

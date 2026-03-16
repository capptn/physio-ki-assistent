import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAuth } from "@/lib/firebase";
import { createCheckoutSession } from "@/lib/sumup";

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();

    console.log("[v0] Checkout request:", { userId, email });

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Missing userId or email" },
        { status: 400 },
      );
    }

    const checkout = await createCheckoutSession(userId, email);
    console.log("[v0] Checkout created:", checkout);

    return NextResponse.json(checkout);
  } catch (error) {
    console.error("[v0] Checkout error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

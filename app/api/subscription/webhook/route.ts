import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Log webhook for debugging
    console.log("[v0] SumUp Webhook received:", payload.event_type);

    // Handle different SumUp events
    switch (payload.event_type) {
      case "checkout.payment.captured":
        // Payment successful - user gets access
        console.log("[v0] Payment captured for checkout:", payload.checkout_id);
        break;

      case "checkout.payment.failed":
        // Payment failed
        console.log("[v0] Payment failed for checkout:", payload.checkout_id);
        break;

      case "checkout.expired":
        // Checkout expired
        console.log("[v0] Checkout expired:", payload.checkout_id);
        break;
    }

    // Always return 200 OK to SumUp
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

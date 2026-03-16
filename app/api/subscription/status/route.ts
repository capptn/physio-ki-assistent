import { NextRequest, NextResponse } from "next/server";
import { getCheckoutStatus } from "@/lib/sumup";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkoutId = searchParams.get("checkoutId");

    if (!checkoutId) {
      return NextResponse.json(
        { error: "Missing checkoutId" },
        { status: 400 },
      );
    }

    const status = await getCheckoutStatus(checkoutId);

    return NextResponse.json(status);
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 },
    );
  }
}

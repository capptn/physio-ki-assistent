import { NextRequest, NextResponse } from "next/server";
import { getCustomerTrainingPlans } from "@/lib/directus";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Benutzer-ID erforderlich" },
        { status: 400 },
      );
    }

    const plans = await getCustomerTrainingPlans(userId);

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("My plans error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}

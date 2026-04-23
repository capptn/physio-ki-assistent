import { NextResponse } from "next/server";
import { getProPlans, getProPlansRaw } from "@/lib/directus";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get("debug") === "1";

  try {
    if (debug) {
      const raw = await getProPlansRaw();
      return NextResponse.json({ raw });
    }
    const plans = await getProPlans();
    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Pro plans error:", error);
    return NextResponse.json(
      {
        error: "Interner Serverfehler",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

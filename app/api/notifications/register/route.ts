import { NextResponse } from "next/server";

// In production, you would save this to a database
// For now, we'll log it so you can copy tokens for testing
const tokens: Set<string> = new Set();

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    tokens.add(token);

    // Log the token for testing purposes
    console.log("[FCM] New token registered:", token);
    console.log("[FCM] Total registered tokens:", tokens.size);

    return NextResponse.json({
      success: true,
      message: "Token registered successfully",
    });
  } catch (error) {
    console.error("[FCM] Error registering token:", error);
    return NextResponse.json(
      { error: "Failed to register token" },
      { status: 500 },
    );
  }
}

export async function GET() {
  // Return all tokens (for admin/testing purposes)
  // In production, protect this endpoint!
  return NextResponse.json({
    tokens: Array.from(tokens),
    count: tokens.size,
  });
}

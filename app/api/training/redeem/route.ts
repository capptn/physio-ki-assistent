import { NextRequest, NextResponse } from "next/server";
import { getTrainingCodeByCode, assignCodeToCustomer } from "@/lib/directus";

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json(
        { error: "Code und Benutzer-ID erforderlich" },
        { status: 400 },
      );
    }

    // Get the training code from Directus
    const trainingCode = await getTrainingCodeByCode(code);

    if (!trainingCode) {
      return NextResponse.json({ error: "Ungültiger Code" }, { status: 404 });
    }

    // Check if the code is expired
    if (trainingCode.gueltigkeit) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(trainingCode.gueltigkeit);
      expiry.setHours(0, 0, 0, 0);

      if (expiry < today) {
        return NextResponse.json(
          { error: "Dieser Trainingsplan ist bereits abgelaufen" },
          { status: 400 },
        );
      }
    }

    // Check if already assigned to someone
    if (trainingCode.customer_id) {
      if (trainingCode.customer_id === userId) {
        return NextResponse.json(
          {
            error: "Dieser Code wurde bereits von dir eingelöst",
            alreadyOwned: true,
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Dieser Code wurde bereits eingelöst" },
        { status: 400 },
      );
    }

    // Assign the code to the customer
    const success = await assignCodeToCustomer(trainingCode.id, userId);

    if (!success) {
      return NextResponse.json(
        { error: "Fehler beim Einlösen des Codes" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Trainingsplan erfolgreich freigeschaltet",
      trainingCode: {
        id: trainingCode.id,
        text: trainingCode.text,
      },
    });
  } catch (error) {
    console.error("Redeem error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}

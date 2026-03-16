export const MONTHLY_PRICE = 9.99; // 9.99€

export interface SumUpCheckout {
  id: string;
  checkout_url: string;
  hosted_checkout_url: string;
}

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
): Promise<SumUpCheckout> {
  const apiKey = process.env.SUMUP_API_KEY;
  const merchantCode = process.env.SUMUP_MERCHANT_CODE;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  console.log("[v0] SumUp config:", {
    hasApiKey: !!apiKey,
    hasMerchantCode: !!merchantCode,
    appUrl,
  });

  if (!apiKey || !merchantCode) {
    throw new Error("SumUp credentials not configured");
  }

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL not configured");
  }

  const body = {
    amount: MONTHLY_PRICE,
    currency: "EUR",
    merchant_code: merchantCode,
    checkout_reference: `sub_${userId}_${Date.now()}`,
    customer_email: userEmail,
    description: "2HEAL PhysioAssistent - Monatliches Abonnement (9,99€)",
    redirect_url: `${appUrl}/subscription/success`,
    hosted_checkout: { enabled: true },
  };

  console.log("[v0] Sending checkout request:", body);

  const response = await fetch("https://api.sumup.com/v0.1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  console.log("[v0] SumUp response status:", response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error("[v0] SumUp API error:", error);
    throw new Error(`SumUp API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  console.log("[v0] Checkout session created:", data);
  return data;
}

export async function getCheckoutStatus(checkoutId: string) {
  const apiKey = process.env.SUMUP_API_KEY;

  if (!apiKey) {
    throw new Error("SumUp API key not configured");
  }

  const response = await fetch(
    `https://api.sumup.com/v0.1/checkouts/${checkoutId}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch checkout status");
  }

  const data: SumUpCheckout = await response.json();
  return data;
}

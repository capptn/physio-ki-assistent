const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

export interface TrainingCode {
  id: string;
  code: string;
  text: string;
  customer_id: string | null;
  gueltigkeit: string | null; // ISO date string e.g. "2025-12-31"
}

async function directusFetch(endpoint: string, options: RequestInit = {}) {
  if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
    console.warn(
      "[v0] Directus configuration missing - DIRECTUS_URL or DIRECTUS_TOKEN not set",
    );
    return { data: [] };
  }

  try {
    const url = `${DIRECTUS_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      console.warn(
        "[v0] Directus request failed:",
        response.status,
        response.statusText,
      );
      return { data: [] };
    }

    return response.json();
  } catch (error) {
    console.error("[v0] Directus fetch error:", error);
    return { data: [] };
  }
}

export async function getTrainingCodeByCode(
  code: string,
): Promise<TrainingCode | null> {
  try {
    const result = await directusFetch(
      `/items/trainings_codes?filter[code][_eq]=${encodeURIComponent(code)}&limit=1`,
    );

    if (result.data && result.data.length > 0) {
      return result.data[0];
    }
    return null;
  } catch (error) {
    console.error("[v0] Error fetching training code:", error);
    return null;
  }
}

export async function assignCodeToCustomer(
  codeId: string,
  customerId: string,
): Promise<boolean> {
  try {
    await directusFetch(`/items/trainings_codes/${codeId}`, {
      method: "PATCH",
      body: JSON.stringify({ customer_id: customerId }),
    });
    return true;
  } catch (error) {
    console.error("[v0] Error assigning code to customer:", error);
    return false;
  }
}

export async function getCustomerTrainingPlans(
  customerId: string,
): Promise<TrainingCode[]> {
  try {
    const result = await directusFetch(
      `/items/trainings_codes?filter[customer_id][_eq]=${encodeURIComponent(customerId)}`,
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter out expired plans
    const plans: TrainingCode[] = (result.data || []).filter(
      (plan: TrainingCode) => {
        if (!plan.gueltigkeit) return true; // no expiry = always valid
        const expiry = new Date(plan.gueltigkeit);
        expiry.setHours(0, 0, 0, 0);
        return expiry >= today;
      },
    );

    return plans;
  } catch (error) {
    console.error("[v0] Error fetching customer training plans:", error);
    return [];
  }
}

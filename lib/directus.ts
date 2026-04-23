import {
  createDirectus,
  rest,
  staticToken,
  readItems,
  updateItem,
  type RestClient,
  type StaticTokenClient,
  type DirectusClient,
} from "@directus/sdk";

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

// ---------------------------------------------------------------------------
// Schema — describes the Directus collections used by this app so the SDK can
// type the responses of readItems / updateItem etc.
// ---------------------------------------------------------------------------

export interface TrainingCode {
  id: string;
  code: string;
  text: string;
  customer_id: string | null;
  gueltigkeit: string | null; // ISO date e.g. "2025-12-31"
}

// A "step" is the same shape across free and pro plans.
export interface PlanStep {
  id: string | number;
  name: string;
  description: string;
  count: string | number | null;
}

// Backwards-compatible alias for code that already imports FreeStep.
export type FreeStep = PlanStep;
export type ProStep = PlanStep;

// Junction rows
// Default Directus naming for an M2M field "steps" between collections
// `free_plans` ↔ `free_steps` is collection `free_plans_free_steps` with
// fields `free_plans_id` + `free_steps_id`. Same pattern for pro_*.
interface FreePlansFreeSteps {
  id: number;
  free_plans_id: number | null;
  free_steps_id: PlanStep | number | null;
}

interface ProPlansProSteps {
  id: number;
  pro_plans_id: number | null;
  pro_steps_id: PlanStep | number | null;
}

// Flat shape returned by getFreePlans / getProPlans.
export interface FreePlan {
  id: string | number;
  name: string;
  duration: string | null;
  goal: string | null;
  target: string | null;
  steps: PlanStep[];
  sort?: number | null;
}

export type ProPlan = FreePlan;

// Raw shapes as stored in Directus — `steps` is a list of junction rows.
interface FreePlanRaw {
  id: number;
  name: string;
  duration: string | null;
  goal: string | null;
  target: string | null;
  sort: number | null;
  steps: FreePlansFreeSteps[];
}

interface ProPlanRaw {
  id: number;
  name: string;
  duration: string | null;
  goal: string | null;
  target: string | null;
  sort: number | null;
  steps: ProPlansProSteps[];
}

interface Schema {
  trainings_codes: TrainingCode[];
  free_plans: FreePlanRaw[];
  free_steps: PlanStep[];
  free_plans_free_steps: FreePlansFreeSteps[];
  pro_plans: ProPlanRaw[];
  pro_steps: PlanStep[];
  pro_plans_pro_steps: ProPlansProSteps[];
}

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

type Client = DirectusClient<Schema> &
  RestClient<Schema> &
  StaticTokenClient<Schema>;

let cachedClient: Client | null = null;

function getClient(): Client | null {
  if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
    console.warn(
      "[directus] DIRECTUS_URL or DIRECTUS_TOKEN missing — returning empty results.",
    );
    return null;
  }
  if (!cachedClient) {
    cachedClient = createDirectus<Schema>(DIRECTUS_URL)
      .with(staticToken(DIRECTUS_TOKEN))
      .with(rest()) as Client;
  }
  return cachedClient;
}

// ---------------------------------------------------------------------------
// Free plans
// ---------------------------------------------------------------------------

export async function getFreePlans(): Promise<FreePlan[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const rows = await client.request(
      readItems("free_plans", {
        fields: ["*", { steps: [{ free_steps_id: ["*"] }] }],
      }),
    );
    return (rows as FreePlanRaw[]).map(normalizeFreePlan);
  } catch (error) {
    console.error("[directus] Error fetching free plans:", error);
    // Re-throw so the API route can surface the real cause to the client.
    throw error;
  }
}

// Diagnostic helper used by /api/training/free-plans?debug=1
export async function getFreePlansRaw(): Promise<unknown> {
  const client = getClient();
  if (!client) return { error: "client_not_configured" };
  try {
    const rows = await client.request(
      readItems("free_plans", {
        fields: ["*", { steps: ["*"] }],
      }),
    );
    return rows;
  } catch (error) {
    return {
      error: "fetch_failed",
      message: error instanceof Error ? error.message : String(error),
      details: error,
    };
  }
}

// ---------------------------------------------------------------------------
// Pro (premium) plans
// ---------------------------------------------------------------------------

export async function getProPlans(): Promise<ProPlan[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const rows = await client.request(
      readItems("pro_plans", {
        fields: ["*", { steps: [{ pro_steps_id: ["*"] }] }],
      }),
    );
    return (rows as ProPlanRaw[]).map(normalizeProPlan);
  } catch (error) {
    console.error("[directus] Error fetching pro plans:", error);
    throw error;
  }
}

function normalizeProPlan(plan: ProPlanRaw): ProPlan {
  const steps: PlanStep[] = (plan.steps ?? [])
    .map((junction): PlanStep | null => {
      const inner = junction?.pro_steps_id;
      if (inner && typeof inner === "object") {
        return {
          id: inner.id,
          name: inner.name ?? "",
          description: inner.description ?? "",
          count: inner.count ?? null,
        };
      }
      return null;
    })
    .filter((s): s is PlanStep => s !== null);

  return {
    id: plan.id,
    name: plan.name ?? "",
    duration: plan.duration ?? null,
    goal: plan.goal ?? null,
    target: plan.target ?? null,
    steps,
    sort: plan.sort ?? null,
  };
}

// Diagnostic helper used by /api/training/pro-plans?debug=1
export async function getProPlansRaw(): Promise<unknown> {
  const client = getClient();
  if (!client) return { error: "client_not_configured" };
  try {
    const rows = await client.request(
      readItems("pro_plans", {
        fields: ["*", { steps: ["*"] }],
      }),
    );
    return rows;
  } catch (error) {
    return {
      error: "fetch_failed",
      message: error instanceof Error ? error.message : String(error),
      details: error,
    };
  }
}

function normalizeFreePlan(plan: FreePlanRaw): FreePlan {
  const steps: FreeStep[] = (plan.steps ?? [])
    .map((junction): FreeStep | null => {
      const inner = junction?.free_steps_id;
      if (inner && typeof inner === "object") {
        return {
          id: inner.id,
          name: inner.name ?? "",
          description: inner.description ?? "",
          count: inner.count ?? null,
        };
      }
      return null;
    })
    .filter((s): s is FreeStep => s !== null);

  return {
    id: plan.id,
    name: plan.name ?? "",
    duration: plan.duration ?? null,
    goal: plan.goal ?? null,
    target: plan.target ?? null,
    steps,
    sort: plan.sort ?? null,
  };
}

// ---------------------------------------------------------------------------
// Training codes
// ---------------------------------------------------------------------------

export async function getTrainingCodeByCode(
  code: string,
): Promise<TrainingCode | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const rows = await client.request(
      readItems("trainings_codes", {
        filter: { code: { _eq: code } },
        limit: 1,
      }),
    );
    return rows[0] ?? null;
  } catch (error) {
    console.error("[directus] Error fetching training code:", error);
    return null;
  }
}

export async function assignCodeToCustomer(
  codeId: string,
  customerId: string,
): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  try {
    await client.request(
      updateItem("trainings_codes", codeId, { customer_id: customerId }),
    );
    return true;
  } catch (error) {
    console.error("[directus] Error assigning code to customer:", error);
    return false;
  }
}

export async function getCustomerTrainingPlans(
  customerId: string,
): Promise<TrainingCode[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const rows = await client.request(
      readItems("trainings_codes", {
        filter: { customer_id: { _eq: customerId } },
      }),
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return rows.filter((plan) => {
      if (!plan.gueltigkeit) return true;
      const expiry = new Date(plan.gueltigkeit);
      expiry.setHours(0, 0, 0, 0);
      return expiry >= today;
    });
  } catch (error) {
    console.error("[directus] Error fetching customer training plans:", error);
    return [];
  }
}

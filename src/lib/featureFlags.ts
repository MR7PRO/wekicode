import { supabase } from "@/integrations/supabase/client";

export type FeatureKey =
  | "onboarding"
  | "achievements"
  | "referrals"
  | "leaderboards"
  | "ai_tools"
  | "public_knowledge"
  | "semantic_search"
  | "pwa"
  | "offline_reading"
  | "push_notifications"
  | "install_prompt"
  | "mobile_action_sheet"
  | "marketplace_enabled"
  | "services_enabled"
  | "project_requests_enabled"
  | "proposals_enabled"
  | "orders_enabled"
  | "reviews_enabled"
  | "payments_enabled"
  | "provider_stripe_enabled"
  | "provider_paypal_enabled"
  | "manual_payment_enabled";

/** Build-time defaults. Env vars win over these, DB flags win over env. */
const DEFAULTS: Record<FeatureKey, boolean> = {
  onboarding: true,
  achievements: true,
  referrals: true,
  leaderboards: true,
  ai_tools: true,
  public_knowledge: true,
  semantic_search: false,
  pwa: true,
  offline_reading: true,
  push_notifications: false,
  install_prompt: true,
  mobile_action_sheet: true,
  // Phase 9 — marketplace
  marketplace_enabled: true,
  services_enabled: true,
  project_requests_enabled: true,
  proposals_enabled: true,
  orders_enabled: true,
  reviews_enabled: true,
  /** Payments stay OFF until a provider is actually configured server-side. */
  payments_enabled: false,
  provider_stripe_enabled: false,
  provider_paypal_enabled: false,
  manual_payment_enabled: true,
};

const ENV_MAP: Record<FeatureKey, string> = {
  onboarding: "VITE_FEATURE_ONBOARDING",
  achievements: "VITE_FEATURE_ACHIEVEMENTS",
  referrals: "VITE_FEATURE_REFERRALS",
  leaderboards: "VITE_FEATURE_LEADERBOARDS",
  ai_tools: "VITE_FEATURE_AI_TOOLS",
  public_knowledge: "VITE_FEATURE_PUBLIC_KNOWLEDGE",
  semantic_search: "VITE_FEATURE_SEMANTIC_SEARCH",
  pwa: "VITE_FEATURE_PWA",
  offline_reading: "VITE_FEATURE_OFFLINE_READING",
  push_notifications: "VITE_FEATURE_PUSH",
  install_prompt: "VITE_FEATURE_INSTALL_PROMPT",
  mobile_action_sheet: "VITE_FEATURE_MOBILE_ACTION_SHEET",
  marketplace_enabled: "VITE_FEATURE_MARKETPLACE",
  services_enabled: "VITE_FEATURE_SERVICES",
  project_requests_enabled: "VITE_FEATURE_PROJECT_REQUESTS",
  proposals_enabled: "VITE_FEATURE_PROPOSALS",
  orders_enabled: "VITE_FEATURE_ORDERS",
  reviews_enabled: "VITE_FEATURE_REVIEWS",
  payments_enabled: "VITE_FEATURE_PAYMENTS",
  provider_stripe_enabled: "VITE_FEATURE_PROVIDER_STRIPE",
  provider_paypal_enabled: "VITE_FEATURE_PROVIDER_PAYPAL",
  manual_payment_enabled: "VITE_FEATURE_MANUAL_PAYMENT",
};

function envFlag(key: FeatureKey): boolean | undefined {
  const raw = (import.meta.env as Record<string, string | undefined>)[ENV_MAP[key]];
  if (raw === undefined) return undefined;
  return raw === "true" || raw === "1";
}

let remoteFlags: Partial<Record<FeatureKey, boolean>> = {};

/** Synchronous check — uses cached remote flags, env, then defaults. */
export function isFeatureEnabled(key: FeatureKey): boolean {
  if (key in remoteFlags) return !!remoteFlags[key];
  const env = envFlag(key);
  if (env !== undefined) return env;
  return DEFAULTS[key];
}

/** Load admin-controlled flags from the database (called once at app start). */
export async function loadRemoteFlags(): Promise<Record<string, boolean>> {
  const { data, error } = await supabase.from("feature_flags").select("key, enabled");
  if (error || !data) return {};
  const map: Partial<Record<FeatureKey, boolean>> = {};
  for (const row of data) map[row.key as FeatureKey] = row.enabled;
  remoteFlags = map;
  return map as Record<string, boolean>;
}
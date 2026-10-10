/**
 * Fail-fast safety gate for RLS tests. Evaluated at module load, before any
 * database client is created. Pure function so it can be unit-tested offline.
 */
export const PROD_REFS = ["epajjiiuaqjieecvmpln"];
export const PROD_HOSTS = ["wekicode.lovable.app", "lovable.app"];

const REQUIRED = [
  "RLS_TEST_ENV",
  "RLS_TEST_URL",
  "RLS_TEST_ANON_KEY",
  "RLS_USER_A_EMAIL",
  "RLS_USER_A_PASSWORD",
  "RLS_USER_B_EMAIL",
  "RLS_USER_B_PASSWORD",
] as const;

export type GateResult =
  | { status: "skip"; reason: string }
  | { status: "ok" }
  | { status: "reject"; errors: string[] };

function jwtRole(key: string): string | null {
  try {
    const payload = key.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return typeof json.role === "string" ? json.role : null;
  } catch {
    return null;
  }
}

export function evaluateRlsEnv(env: Record<string, string | undefined>): GateResult {
  const anySet = REQUIRED.some((k) => env[k]);
  if (!anySet) return { status: "skip", reason: "No isolated RLS test environment configured." };

  const errors: string[] = [];
  for (const k of REQUIRED) if (!env[k]) errors.push(`Missing ${k}`);

  if (env.RLS_TEST_ENV && !["staging", "local", "test"].includes(env.RLS_TEST_ENV))
    errors.push("RLS_TEST_ENV must be one of: staging, local, test");

  if (env.SUPABASE_SERVICE_ROLE_KEY || env.RLS_TEST_SERVICE_ROLE_KEY)
    errors.push("Service-role key present in environment; refusing to run");

  const url = env.RLS_TEST_URL ?? "";
  if (url) {
    let host = "";
    try {
      host = new URL(url).hostname.toLowerCase();
    } catch {
      errors.push("RLS_TEST_URL is not a valid URL");
    }
    const lower = url.toLowerCase();
    if (PROD_REFS.some((r) => lower.includes(r))) errors.push("RLS_TEST_URL points at the production project");
    if (host && PROD_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)))
      errors.push("RLS_TEST_URL points at a production host");
    if (env.VITE_SUPABASE_URL && lower.replace(/\/$/, "") === env.VITE_SUPABASE_URL.toLowerCase().replace(/\/$/, ""))
      errors.push("RLS_TEST_URL equals the app's configured backend URL");
  }

  const key = env.RLS_TEST_ANON_KEY ?? "";
  if (key) {
    if (PROD_REFS.some((r) => key.includes(r))) errors.push("RLS_TEST_ANON_KEY belongs to production");
    if (env.VITE_SUPABASE_PUBLISHABLE_KEY && key === env.VITE_SUPABASE_PUBLISHABLE_KEY)
      errors.push("RLS_TEST_ANON_KEY equals the app's production key");
    const role = jwtRole(key);
    if (role && role !== "anon") errors.push(`RLS_TEST_ANON_KEY has role "${role}"; only anon is allowed`);
    if (key.startsWith("sb_secret_")) errors.push("RLS_TEST_ANON_KEY is a secret key; only publishable keys allowed");
    // Decode ref from anon JWT and reject production
    try {
      const p = JSON.parse(Buffer.from(key.split(".")[1] ?? "", "base64").toString("utf8"));
      if (p?.ref && PROD_REFS.includes(p.ref)) errors.push("RLS_TEST_ANON_KEY ref is production");
    } catch { /* non-JWT publishable key */ }
  }

  for (const k of ["RLS_USER_A_EMAIL", "RLS_USER_B_EMAIL"]) {
    const v = env[k];
    if (v && !/(\+rls|test|staging)/i.test(v)) errors.push(`${k} must be a dedicated test account (contain +rls, test or staging)`);
  }
  if (env.RLS_USER_A_EMAIL && env.RLS_USER_A_EMAIL === env.RLS_USER_B_EMAIL) errors.push("User A and B must differ");

  return errors.length ? { status: "reject", errors } : { status: "ok" };
}

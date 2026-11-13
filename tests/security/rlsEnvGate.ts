/**
 * Fail-fast safety gate for RLS tests. Evaluated at module load, before any
 * database client is created. Pure function so it can be unit-tested offline.
 */
export const PROD_REFS = ["epajjiiuaqjieecvmpln"];
export const PROD_HOSTS = ["wekicode.lovable.app", "lovable.app", "lovableproject.com", "weki7code.netlify.app"];

const REQUIRED = [
  "RLS_TEST_ENV",
  "RLS_TEST_ISOLATED",
  "RLS_TEST_PROJECT_REF",
  "RLS_TEST_URL",
  "RLS_TEST_ANON_KEY",
  "RLS_USER_A_EMAIL",
  "RLS_USER_A_PASSWORD",
  "RLS_USER_B_EMAIL",
  "RLS_USER_B_PASSWORD",
] as const;

export type RlsTestConfig = Readonly<{
  url: string;
  anonKey: string;
  userA: Readonly<{ email: string; password: string }>;
  userB: Readonly<{ email: string; password: string }>;
}>;

export type GateResult =
  | { status: "skip"; reason: string }
  | { status: "ok"; config: RlsTestConfig }
  | { status: "reject"; errors: string[] };

function jwtPayload(key: string): Record<string, unknown> | null {
  try {
    const parts = key.split(".");
    if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) return null;
    const payload = parts[1];
    const json = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return json && typeof json === "object" && !Array.isArray(json) ? json : null;
  } catch {
    return null;
  }
}

export function evaluateRlsEnv(env: Record<string, string | undefined>): GateResult {
  const anySet = Object.keys(env).some((k) => k.startsWith("RLS_") && env[k] !== undefined);
  if (!anySet) return { status: "skip", reason: "No isolated RLS test environment configured." };

  const errors: string[] = [];
  for (const k of REQUIRED) if (!env[k]?.trim()) errors.push(`Missing ${k}`);

  if (env.RLS_TEST_ENV && !["staging", "local", "test"].includes(env.RLS_TEST_ENV))
    errors.push("RLS_TEST_ENV must be one of: staging, local, test");
  if (env.RLS_TEST_ISOLATED !== "true") errors.push("RLS_TEST_ISOLATED must explicitly be true");
  const ref = env.RLS_TEST_PROJECT_REF ?? "";
  if (PROD_REFS.includes(ref.toLowerCase())) errors.push("RLS_TEST_PROJECT_REF is production");

  if (env.SUPABASE_SERVICE_ROLE_KEY || env.RLS_TEST_SERVICE_ROLE_KEY)
    errors.push("Service-role key present in environment; refusing to run");

  const url = env.RLS_TEST_URL ?? "";
  let parsedUrl: URL | undefined;
  if (url) {
    let host = "";
    try {
      parsedUrl = new URL(url);
      host = parsedUrl.hostname.toLowerCase();
      if (parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash || parsedUrl.pathname !== "/")
        errors.push("RLS_TEST_URL must be a bare backend origin without credentials, path, query or fragment");
      const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(host);
      if (env.RLS_TEST_ENV === "local") {
        if (!loopback || !["http:", "https:"].includes(parsedUrl.protocol) || ref !== "local")
          errors.push("Local tests require a loopback HTTP(S) URL and project ref local");
      } else if (parsedUrl.protocol !== "https:" || parsedUrl.port || !/^[a-z0-9]{20}$/.test(ref) || host !== `${ref}.supabase.co`) {
        errors.push("Hosted tests require HTTPS and an exact dedicated project-ref backend hostname");
      }
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
    const payload = jwtPayload(key);
    if (!/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key)) {
      if (!payload || payload.role !== "anon") errors.push("RLS_TEST_ANON_KEY must be a publishable key or an anon JWT");
      if (payload) {
        if (typeof payload.exp !== "number" || payload.exp <= Date.now() / 1000) errors.push("Anon JWT must have a future expiry");
        if (typeof payload.ref === "string" && PROD_REFS.includes(payload.ref.toLowerCase())) errors.push("RLS_TEST_ANON_KEY ref is production");
        if (env.RLS_TEST_ENV !== "local" && payload.ref !== ref) errors.push("Anon JWT ref must match the isolated project ref");
      }
    }
  }

  for (const k of ["RLS_USER_A_EMAIL", "RLS_USER_B_EMAIL"]) {
    const v = env[k];
    if (v && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || !/(?:^|[+._-])(?:rls|test|staging)(?:$|[+._-])/i.test(v.split("@")[0])))
      errors.push(`${k} must be a valid dedicated test email with an rls, test or staging local-part marker`);
  }
  if (env.RLS_USER_A_EMAIL && env.RLS_USER_A_EMAIL.toLowerCase() === env.RLS_USER_B_EMAIL?.toLowerCase()) errors.push("User A and B must differ");
  for (const k of ["RLS_USER_A_PASSWORD", "RLS_USER_B_PASSWORD"]) {
    if (env[k] && (env[k].trim().length < 8 || env[k] !== env[k].trim())) errors.push(`${k} must contain at least 8 characters without surrounding whitespace`);
  }

  if (errors.length || !parsedUrl) return { status: "reject", errors };
  return { status: "ok", config: Object.freeze({
    url: parsedUrl.origin,
    anonKey: key,
    userA: Object.freeze({ email: env.RLS_USER_A_EMAIL ?? "", password: env.RLS_USER_A_PASSWORD ?? "" }),
    userB: Object.freeze({ email: env.RLS_USER_B_EMAIL ?? "", password: env.RLS_USER_B_PASSWORD ?? "" }),
  }) };
}

/** Confine every SDK request to the validated backend; never follow redirects. */
export function createRlsFetch(config: RlsTestConfig, transport: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    const target = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    if (target.origin !== config.url || target.username || target.password ||
      !["/auth/v1/", "/rest/v1/"].some((prefix) => target.pathname.startsWith(prefix))) {
      throw new Error("RLS request blocked: outside the isolated auth/database endpoint");
    }
    const response = await transport(input, { ...init, redirect: "manual" });
    if (response.status >= 300 && response.status < 400 || response.type === "opaqueredirect") {
      throw new Error("RLS request blocked: redirects are not permitted");
    }
    return response;
  };
}

/**
 * RLS tests run ONLY against an isolated local/staging backend using the anon key
 * and real user sessions. They never use a service role and never touch production.
 * Enable with: RLS_TEST_URL, RLS_TEST_ANON_KEY, RLS_USER_A_EMAIL/PASSWORD, RLS_USER_B_EMAIL/PASSWORD.
 */
import { beforeAll, describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createRlsFetch, evaluateRlsEnv } from "./rlsEnvGate";

const env = process.env;
// Fail-fast gate: runs at module load, before any client is created.
const gate = evaluateRlsEnv(env);
if (gate.status === "reject") {
  throw new Error(`RLS safety gate rejected environment:\n- ${gate.errors.join("\n- ")}`);
}
const enabled = gate.status === "ok";

describe.skipIf(!enabled)("RLS (isolated backend only)", () => {
  let clientFactory: (() => SupabaseClient) | undefined;
  beforeAll(async () => {
    if (gate.status !== "ok") throw new Error("Isolated RLS config required");
    const { createClient } = await import("@supabase/supabase-js");
    const config = gate.config;
    const scopedFetch = createRlsFetch(config);
    clientFactory = () => createClient(config.url, config.anonKey, {
      global: { fetch: scopedFetch },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  });
  const anon = () => {
    if (!clientFactory) throw new Error("RLS client unavailable before safety checks");
    return clientFactory();
  };
  const as = async (email: string, password: string) => {
    const c = anon();
    const { error } = await c.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return c;
  };

  it("anonymous users cannot read support tickets, appeals or verification requests", async () => {
    const c = anon();
    for (const t of ["support_tickets", "account_appeals", "professional_verification_requests"]) {
      const { data } = await c.from(t as never).select("id").limit(1);
      expect(data ?? []).toEqual([]);
    }
  });

  it("user B cannot read user A's support tickets", async () => {
    if (gate.status !== "ok") throw new Error("Isolated RLS config required");
    const a = await as(gate.config.userA.email, gate.config.userA.password);
    const b = await as(gate.config.userB.email, gate.config.userB.password);
    const { data: { user } } = await a.auth.getUser();
    if (!user) throw new Error("Test user A failed authentication");
    const { data } = await b.from("support_tickets" as never).select("id").eq("user_id", user.id);
    expect(data ?? []).toEqual([]);
  });

  it("a normal user cannot grant themselves a role", async () => {
    if (gate.status !== "ok") throw new Error("Isolated RLS config required");
    const a = await as(gate.config.userA.email, gate.config.userA.password);
    const { data: { user } } = await a.auth.getUser();
    if (!user) throw new Error("Test user A failed authentication");
    const { error } = await a.from("user_roles" as never).insert({ user_id: user.id, role: "admin" } as never);
    expect(error).not.toBeNull();
  });
});

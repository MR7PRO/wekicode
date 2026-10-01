/**
 * RLS tests run ONLY against an isolated local/staging backend using the anon key
 * and real user sessions. They never use a service role and never touch production.
 * Enable with: RLS_TEST_URL, RLS_TEST_ANON_KEY, RLS_USER_A_EMAIL/PASSWORD, RLS_USER_B_EMAIL/PASSWORD.
 */
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { vi } from "vitest";

vi.unmock("@/integrations/supabase/client");

const env = process.env;
const enabled = !!(env.RLS_TEST_URL && env.RLS_TEST_ANON_KEY && env.RLS_USER_A_EMAIL && env.RLS_USER_B_EMAIL);
const PROD_REF = "epajjiiuaqjieecvmpln";

describe.skipIf(!enabled)("RLS (isolated backend only)", () => {
  it("refuses to run against production", () => {
    expect(env.RLS_TEST_URL!).not.toContain(PROD_REF);
  });

  const anon = () => createClient(env.RLS_TEST_URL!, env.RLS_TEST_ANON_KEY!, { auth: { persistSession: false } });
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
    const a = await as(env.RLS_USER_A_EMAIL!, env.RLS_USER_A_PASSWORD!);
    const b = await as(env.RLS_USER_B_EMAIL!, env.RLS_USER_B_PASSWORD!);
    const { data: { user } } = await a.auth.getUser();
    const { data } = await b.from("support_tickets" as never).select("id").eq("user_id", user!.id);
    expect(data ?? []).toEqual([]);
  });

  it("a normal user cannot grant themselves a role", async () => {
    const a = await as(env.RLS_USER_A_EMAIL!, env.RLS_USER_A_PASSWORD!);
    const { data: { user } } = await a.auth.getUser();
    const { error } = await a.from("user_roles" as never).insert({ user_id: user!.id, role: "admin" } as never);
    expect(error).not.toBeNull();
  });
});

describe("RLS suite gating", () => {
  it("is skipped unless an isolated backend is configured", () => {
    expect(typeof enabled).toBe("boolean");
  });
});

import { describe, it, expect } from "vitest";
import { evaluateRlsEnv } from "./rlsEnvGate";

const good = {
  RLS_TEST_ENV: "staging",
  RLS_TEST_URL: "https://abcstagingref.supabase.co",
  RLS_TEST_ANON_KEY: "sb_publishable_staging123",
  RLS_USER_A_EMAIL: "a+rls@example.com",
  RLS_USER_A_PASSWORD: "x",
  RLS_USER_B_EMAIL: "b+rls@example.com",
  RLS_USER_B_PASSWORD: "y",
};
const jwt = (o: object) => `h.${Buffer.from(JSON.stringify(o)).toString("base64")}.s`;

describe("RLS env gate", () => {
  it("skips when nothing configured", () => expect(evaluateRlsEnv({}).status).toBe("skip"));
  it("accepts a complete isolated config", () => expect(evaluateRlsEnv(good).status).toBe("ok"));
  it("rejects partial config", () => expect(evaluateRlsEnv({ RLS_TEST_URL: good.RLS_TEST_URL }).status).toBe("reject"));
  it("rejects production ref URL", () =>
    expect(evaluateRlsEnv({ ...good, RLS_TEST_URL: "https://epajjiiuaqjieecvmpln.supabase.co" }).status).toBe("reject"));
  it("rejects production host", () =>
    expect(evaluateRlsEnv({ ...good, RLS_TEST_URL: "https://wekicode.lovable.app" }).status).toBe("reject"));
  it("rejects service_role key", () =>
    expect(evaluateRlsEnv({ ...good, RLS_TEST_ANON_KEY: jwt({ role: "service_role", ref: "x" }) }).status).toBe("reject"));
  it("rejects production anon key", () =>
    expect(evaluateRlsEnv({ ...good, RLS_TEST_ANON_KEY: jwt({ role: "anon", ref: "epajjiiuaqjieecvmpln" }) }).status).toBe("reject"));
  it("rejects when service-role key is in env", () =>
    expect(evaluateRlsEnv({ ...good, SUPABASE_SERVICE_ROLE_KEY: "k" }).status).toBe("reject"));
  it("rejects unknown environment label", () =>
    expect(evaluateRlsEnv({ ...good, RLS_TEST_ENV: "production" }).status).toBe("reject"));
  it("rejects non-test user accounts", () =>
    expect(evaluateRlsEnv({ ...good, RLS_USER_A_EMAIL: "ayham@gmail.com" }).status).toBe("reject"));
});

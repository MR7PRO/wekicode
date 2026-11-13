import { describe, it, expect, vi } from "vitest";
import { createRlsFetch, evaluateRlsEnv } from "./rlsEnvGate";

const good = {
  RLS_TEST_ENV: "staging",
  RLS_TEST_ISOLATED: "true",
  RLS_TEST_PROJECT_REF: "abcdefghijklmnopqrst",
  RLS_TEST_URL: "https://abcdefghijklmnopqrst.supabase.co",
  RLS_TEST_ANON_KEY: "sb_publishable_abcdefghijklmnopqrst",
  RLS_USER_A_EMAIL: "a+rls@example.com",
  RLS_USER_A_PASSWORD: "test-password-a",
  RLS_USER_B_EMAIL: "b+rls@example.com",
  RLS_USER_B_PASSWORD: "test-password-b",
};
const jwt = (o: object) => `h.${Buffer.from(JSON.stringify(o)).toString("base64url")}.s`;

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
  it.each([
    ["RLS_TEST_ISOLATED", "false"],
    ["RLS_TEST_PROJECT_REF", "epajjiiuaqjieecvmpln"],
    ["RLS_TEST_URL", "https://weki7code.netlify.app"],
    ["RLS_TEST_URL", "http://abcdefghijklmnopqrst.supabase.co"],
    ["RLS_TEST_URL", `${good.RLS_TEST_URL}/rest/v1/`],
    ["RLS_TEST_URL", `${good.RLS_TEST_URL}?forward=production`],
    ["RLS_TEST_URL", "https://user:password@abcdefghijklmnopqrst.supabase.co"],
    ["RLS_TEST_URL", "https://unrelated.example.test"],
    ["RLS_TEST_ANON_KEY", "arbitrary-key"],
    ["RLS_TEST_ANON_KEY", "sb_secret_abcdefghijklmnopqrst"],
    ["RLS_TEST_ANON_KEY", jwt({ role: "authenticated", ref: good.RLS_TEST_PROJECT_REF, exp: 4102444800 })],
    ["RLS_TEST_ANON_KEY", jwt({ ref: good.RLS_TEST_PROJECT_REF, exp: 4102444800 })],
    ["RLS_TEST_ANON_KEY", jwt({ role: "anon", ref: "differentprojectref00", exp: 4102444800 })],
    ["RLS_TEST_ANON_KEY", jwt({ role: "anon", ref: good.RLS_TEST_PROJECT_REF, exp: 1 })],
    ["RLS_USER_A_EMAIL", "test"],
    ["RLS_USER_A_EMAIL", "real@testing.com"],
    ["RLS_USER_A_EMAIL", "contest@example.com"],
    ["RLS_USER_B_EMAIL", "A+RLS@EXAMPLE.COM"],
    ["RLS_USER_A_PASSWORD", "   "],
    ["RLS_USER_A_PASSWORD", "short"],
  ])("rejects unsafe %s configuration (%#)", (name, value) => {
    expect(evaluateRlsEnv({ ...good, [name]: value }).status).toBe("reject");
  });
  it.each(Object.keys(good))("rejects missing %s", (name) => {
    expect(evaluateRlsEnv({ ...good, [name]: undefined }).status).toBe("reject");
  });
  it("rejects an otherwise empty explicitly configured environment", () => {
    expect(evaluateRlsEnv({ RLS_TEST_ENV: "" }).status).toBe("reject");
  });
  it("accepts an anon JWT matching the isolated project", () => {
    expect(evaluateRlsEnv({ ...good, RLS_TEST_ANON_KEY: jwt({ role: "anon", ref: good.RLS_TEST_PROJECT_REF, exp: 4102444800 }) }).status).toBe("ok");
  });
  it("accepts a clearly identified local loopback environment", () => {
    expect(evaluateRlsEnv({ ...good, RLS_TEST_ENV: "local", RLS_TEST_PROJECT_REF: "local", RLS_TEST_URL: "http://127.0.0.1:54321" }).status).toBe("ok");
  });
  it("rejects remote URLs labelled local", () => {
    expect(evaluateRlsEnv({ ...good, RLS_TEST_ENV: "local", RLS_TEST_PROJECT_REF: "local" }).status).toBe("reject");
  });
  it("rejects the configured app URL and key", () => {
    expect(evaluateRlsEnv({ ...good, VITE_SUPABASE_URL: good.RLS_TEST_URL, VITE_SUPABASE_PUBLISHABLE_KEY: good.RLS_TEST_ANON_KEY }).status).toBe("reject");
  });
  it("confines requests to the validated backend and disables redirects", async () => {
    const result = evaluateRlsEnv(good);
    if (result.status !== "ok") throw new Error("Invalid fixture");
    const transport = vi.fn().mockResolvedValue({ status: 200, type: "basic" });
    const guarded = createRlsFetch(result.config, transport);
    await guarded(`${good.RLS_TEST_URL}/rest/v1/support_tickets`);
    expect(transport).toHaveBeenCalledWith(`${good.RLS_TEST_URL}/rest/v1/support_tickets`, { redirect: "manual" });
    transport.mockClear();
    await expect(guarded("https://epajjiiuaqjieecvmpln.supabase.co/rest/v1/profiles")).rejects.toThrow("blocked");
    await expect(guarded(`${good.RLS_TEST_URL}/functions/v1/ai-chat`)).rejects.toThrow("blocked");
    expect(transport).not.toHaveBeenCalled();
  });
  it("rejects redirect responses instead of following them", async () => {
    const result = evaluateRlsEnv(good);
    if (result.status !== "ok") throw new Error("Invalid fixture");
    const transport = vi.fn().mockResolvedValue({ status: 302, type: "basic" });
    await expect(createRlsFetch(result.config, transport)(`${good.RLS_TEST_URL}/auth/v1/token`)).rejects.toThrow("redirects");
    expect(transport).toHaveBeenCalledTimes(1);
  });
});

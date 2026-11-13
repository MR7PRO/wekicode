import { afterEach, describe, expect, it, vi } from "vitest";

const sdkLoaded = vi.hoisted(() => vi.fn());
vi.mock("@supabase/supabase-js", () => {
  sdkLoaded();
  throw new Error("Database SDK must not load in rejected environments");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  sdkLoaded.mockClear();
});

describe("RLS startup safety", () => {
  it.each([
    { RLS_TEST_ENV: "staging", RLS_TEST_URL: "https://epajjiiuaqjieecvmpln.supabase.co" },
    { RLS_TEST_ENV: "staging", RLS_TEST_URL: "https://weki7code.netlify.app" },
    { RLS_TEST_ENV: "staging" },
  ])("rejects unsafe configuration before loading the database SDK (%#)", async (env) => {
    vi.resetModules();
    vi.stubEnv("RLS_TEST_ENV", env.RLS_TEST_ENV);
    vi.stubEnv("RLS_TEST_URL", env.RLS_TEST_URL);
    await expect(import("./rls.test")).rejects.toThrow("RLS safety gate rejected environment");
    expect(sdkLoaded).not.toHaveBeenCalled();
  });
});
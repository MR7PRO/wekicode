import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// Execute the actual CORS helper without loading the server, auth, or AI calls.
const source = readFileSync("supabase/functions/ai-chat/index.ts", "utf8");
const corsSource = source.slice(source.indexOf("const ALLOWED_ORIGINS"), source.indexOf("// Input validation constants"));
const javascript = ts.transpileModule(`${corsSource}\ngetCorsHeaders;`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const getCorsHeaders = runInNewContext(javascript) as (origin: string | null) => Record<string, string>;

describe("AI assistant CORS", () => {
  it("allows the published WekiCode Netlify origin", () => {
    expect(getCorsHeaders("https://weki7code.netlify.app")["Access-Control-Allow-Origin"]).toBe("https://weki7code.netlify.app");
  });

  it("preserves the Lovable preview origin", () => {
    const origin = "https://a699ad31-eba0-4c1b-ae9b-fe12b2562e4e.lovableproject.com";
    expect(getCorsHeaders(origin)["Access-Control-Allow-Origin"]).toBe(origin);
  });

  it("does not allow other Netlify sites", () => {
    const origin = "https://untrusted.netlify.app";
    expect(getCorsHeaders(origin)["Access-Control-Allow-Origin"]).not.toBe(origin);
  });
});
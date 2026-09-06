import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => cleanup());

// jsdom does not implement these browser APIs used across the app.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error test stub
window.ResizeObserver = window.ResizeObserver || ResizeObserverStub;
// @ts-expect-error test stub
window.IntersectionObserver = window.IntersectionObserver || class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
};

if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}

// Never let a test reach a real backend, mailer, push service or AI provider.
vi.mock("@/integrations/supabase/client", () => {
  const chain: Record<string, unknown> = {};
  const thenable = { data: null, error: null };
  const builder: any = new Proxy(chain, {
    get(_t, prop) {
      if (prop === "then") return (res: (v: unknown) => unknown) => Promise.resolve(thenable).then(res);
      return () => builder;
    },
  });
  return {
    supabase: {
      from: () => builder,
      rpc: async () => thenable,
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: {}, error: null }),
        signUp: async () => ({ data: {}, error: null }),
        signInWithOAuth: async () => ({ data: {}, error: null }),
        signOut: async () => ({ error: null }),
      },
      functions: { invoke: async () => ({ data: null, error: null }) },
      channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }),
      removeChannel: () => {},
      storage: { from: () => ({ upload: async () => ({ data: null, error: null }), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) },
    },
  };
});

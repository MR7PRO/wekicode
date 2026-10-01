# Testing WekiCode

## Commands
| Command | What it does |
|---|---|
| `bun run test` | Unit + component tests (Vitest, jsdom) |
| `bun run test:watch` | Watch mode |
| `bun run test:coverage` | Coverage for `src/lib` and trust components |
| `bun run test:e2e` | Playwright smoke suite (desktop + `@mobile`) |
| `bun run typecheck` | TypeScript check |
| `bun run verify` | typecheck + tests + build |

## Layout
- `src/test/` – setup (global backend mock), `renderWithProviders`, deterministic factories.
- `tests/unit/` – pure logic: leveling, SEO, feature flags, order state machine, fees, reviews, trust scoring.
- `tests/components/` – trust badges.
- `tests/security/rls.test.ts` – real RLS checks, **skipped** unless an isolated backend is configured.
- `e2e/` – public, SEO, PWA, protected-route and 404 smoke tests.

## Isolation rules
- The backend client is mocked globally in `src/test/setup.ts`; unit tests cannot reach the network.
- No real emails, push, payments, AI calls or identity checks are made.
- RLS tests use the anon key + real user sessions only, never a service role, and refuse to run against production.
  Set `RLS_TEST_URL`, `RLS_TEST_ANON_KEY`, `RLS_USER_A_EMAIL/PASSWORD`, `RLS_USER_B_EMAIL/PASSWORD`.
- The database remains the authority; client rule modules (`orderState`, `reviewRules`, `trust/scoring`) only mirror it.

## Bug severity
P0 security/data leak or payment integrity · P1 core flow broken · P2 degraded feature · P3 cosmetic.

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


## Staging environment for RLS tests

RLS tests run only against a dedicated, isolated backend (never production). A safety gate
(`tests/security/rlsEnvGate.ts`) runs at module load, before any client is created:
- No `RLS_*` vars set → suite is **skipped**.
- Partial or unsafe config → the file **fails immediately** with the reasons.

Setup:
1. Create a separate staging backend and apply the same migrations.
2. Create two test users whose emails contain `+rls`, `test` or `staging`.
3. Export:
   `RLS_TEST_ENV=staging` (or `local`/`test`), `RLS_TEST_URL`, `RLS_TEST_ANON_KEY` (publishable/anon key only),
   `RLS_USER_A_EMAIL`, `RLS_USER_A_PASSWORD`, `RLS_USER_B_EMAIL`, `RLS_USER_B_PASSWORD`.
4. Run `bunx vitest run tests/security`.

The gate rejects: the production project ref/hosts, the app's own backend URL/key, any
`service_role`/secret key, a service-role key present in the environment, and non-test accounts.

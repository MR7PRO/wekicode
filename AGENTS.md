# Test architecture

- RLS tests must validate isolated configuration before importing the database SDK and route every request through an origin-bound, no-redirect fetch guard; this prevents accidental production access.
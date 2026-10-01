# QA Release Checklist

- [ ] `bun run verify` passes (typecheck, tests, build)
- [ ] `bun run test:e2e` passes on desktop and mobile
- [ ] RLS suite run against an isolated backend (not production)
- [ ] Sign up / sign in / sign out / Google sign-in work
- [ ] Create topic, reply, vote, bookmark, mark solution
- [ ] Locked topic rejects new replies
- [ ] Publish service → order → deliver → complete → review
- [ ] Project → proposal → accept
- [ ] Orders cannot be marked paid from the browser
- [ ] Other users cannot open someone else's order, ticket, appeal or verification request
- [ ] Moderator can resolve reports; normal user cannot open /moderation
- [ ] Help, legal, support pages load
- [ ] PWA installs, offline page shows when offline
- [ ] No console errors on main pages; no secrets in logs

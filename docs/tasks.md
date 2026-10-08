# Tasks

Work items, with the reasoning that produced them. Completed items are kept rather than
deleted — the *why* behind a change is usually lost by the time someone asks about it.

## Open

### Rotate exposed credentials — **highest priority**

The local `.env` still contains deployment credentials for local development. `.env.example` has
been sanitized, but provider-side rotation remains required for any values that were previously
exposed.

- [x] Replace `.env.example` values with obvious placeholders
- [ ] Rotate the Neon database password in the console
- [ ] Rotate `SESSION_SECRET`
- [ ] Revoke and reissue the Neon AI gateway token
- [ ] Reissue the Gmail app password
- [ ] Re-enable 2FA afterwards (rotating `SESSION_SECRET` makes stored TOTP secrets unreadable)
- [ ] Add `.env*` to `.gitignore` and purge the values from history if this repo is pushed

Cannot be automated from the repo — each rotation happens in the relevant provider's console.

### Never commit real secrets again

- [ ] Add a `.gitignore` entry for `.env` and `.env.local`
- [ ] Verify `git status` is clean of credential files before the next push

## Done

### Fix 500s from transient database connection failures

The homepage returned `500` with `PrismaClientInitializationError: Can't reach database server`
while the database was in fact healthy. Diagnosis showed a Neon cold start: the compute resumes
on the first connection after idle, and that first connection can be dropped. Measured ~1-in-5
cold-start failures, 2.3–10.8s latency, versus 215–290ms warm.

- [x] Add `src/lib/db-retry.ts` with `withDatabaseRetry()` — exponential backoff, full jitter
- [x] Retry only transient failures; rethrow permanent ones (P2002, P2025, bad config) at once
- [x] Apply to the portfolio read, seed lookup, and idempotent upsert
- [x] Apply to auth reads, including `hasAdminAccess()` where a blip would look like a revoked
      session and eject the administrator
- [x] Deliberately leave non-idempotent writes (`contactMessage.create`) unretried
- [x] Add `npm run test:db-retry` (19 assertions against real Prisma error classes)
- [x] Add `npm run test:coldstart` (8/8 cold starts against the live database)
- [x] Verify `npm run typecheck` and `npm run build`

### Harden the admin sign-in path

- [x] Replace email + password with a single access code
- [x] Enforce a strength policy (20+ chars, 10+ distinct, non-sequential, not on the weak list)
- [x] Compare codes after normalisation so a capitalisation slip cannot lock the owner out
- [x] Add `sessionVersion` so a code change revokes every other session immediately
- [x] Add `npm run admin:reset-code` as the only recovery path

### CSRF and proxy-trust hardening

- [x] Check both `Origin` and `Sec-Fetch-Site` on every state-changing route
- [x] Make `TRUST_PROXY_HEADERS` fail closed
- [x] Collapse unresolvable clients into one shared rate-limit bucket
- [x] Add a shared global rate-limit ceiling so header rotation cannot buy unlimited attempts
- [x] Hash bucket keys with `SESSION_SECRET`

### Stop exposing the development server

- [x] Default `dev`/`start` scripts to localhost
- [x] Add guarded `dev:lan`/`start:lan` requiring `ALLOW_PUBLIC_DEV=1`
- [x] Guard script refuses to run and explains the risk

### Move from SQLite to Neon Postgres

- [x] PostgreSQL datasource with pooled runtime and direct migration URLs
- [x] Port all migrations to `prisma/migrations/`; archive the SQLite ones for reference
- [x] Mark `prisma/dev.db` and `prisma/sqlite-migrations/` as inert in the README

### Documentation

- [x] `docs/prd.md` — product goal, users, scope, requirements
- [x] `docs/architecture.md` — structure, data flow, security model, DB resilience
- [x] `docs/design.md` — visual language, layout, motion, responsiveness
- [x] `docs/rule.md` — engineering conventions
- [x] `docs/memory.md` — decisions and gotchas
- [x] `docs/tasks.md` — this file

# Memory

Decisions and gotchas worth remembering. The reasoning behind a change usually matters more
than the change itself, and is usually the first thing lost.

## Gotchas that will bite again

**`npm run build` fails with `EPERM` on Windows.** `prisma generate` rewrites the Prisma
query-engine DLL. If a `next dev` process is still running, it holds the file and the rename
fails. Stop the dev server before building.

**`server-only` is not in `node_modules`.** Next.js supplies it at build time. Anything run
under plain `tsx` — the seed script, the admin CLI, the tests — cannot resolve
`import "server-only"`. `prisma/shim-server-only.cjs` maps it to an empty module for exactly
this reason.

**Top-level `await` fails under `tsx` here.** The project resolves to CJS output, so test
scripts must wrap async work in an `async function main()`.

**Shell output capture is unreliable in this environment.** Commands get truncated and exit
codes lost. Writing output to a file and reading it back is far more dependable than parsing
terminal output.

## Decisions and why

**Content is one JSON row, not a table per section.** For a single author this means one
transaction, one backup, and no cross-section drift. Revisit only if content grows enough to
need relational querying.

**Never overwrite a stored record to "repair" it.** If stored content fails validation the site
renders defaults and logs. Silently rewriting would destroy the owner's real content the first
time a validation rule tightened — the exact failure this codebase is built to avoid. Repair is
a deliberate re-save from the dashboard.

**An access code instead of email + password.** Simpler for a single-admin site. The cost is
that there is no email recovery path, which is why `npm run admin:reset-code` exists and why
codes are normalised before comparison — a capitalisation slip must not lock the owner out.

**`sessionVersion` instead of a session store.** Bumping one integer invalidates every
issued cookie on every device. Keeps sessions stateless with no session table and no
invalidation list.

**`TRUST_PROXY_HEADERS` fails closed.** Unset means forwarding headers are ignored. Enabling it
on a directly-reachable app would let an attacker rotate `X-Forwarded-For` and bypass rate
limiting, so the dangerous setting is the opt-in, not the default.

**Rate-limit keys are hashed with `SESSION_SECRET`.** The table never stores a raw IP. The
shared global ceiling exists because the per-address key is spoofable when the app is reachable
directly.

**A shared validation module for the access code.** `src/lib/access-code.ts` is imported by the
API, the admin UI, and the CLI, so all three enforce identical rules and the client can
pre-validate before submitting.

**Development servers bind to localhost.** A dev build carries source maps, verbose overlays
and relaxed headers. The `*:lan` scripts refuse to run without `ALLOW_PUBLIC_DEV=1`.

**`withDatabaseRetry()` retries only transient failures.** P2002 and friends are rethrown
immediately — replaying a permanent failure only delays an actionable error.

**Only replay-safe operations are retried.** Reads and upserts qualify. `contactMessage.create`
does not: the first attempt may have committed before the connection dropped, so a retry can
duplicate a visitor's message.

## Measurements worth keeping

Taken on the development machine while diagnosing the cold-start 500s:

| Metric | Value |
| --- | --- |
| Warm query latency | 215–290 ms |
| Cold query latency | 2.3–10.8 s |
| Cold-start failure rate before the fix | ~1 in 5 |
| Cold starts passing after the fix | 8 / 8 |
| Retry unit assertions | 19 / 19 |

## Open risk

Credentials for the database, `SESSION_SECRET`, the SMTP account, and the Neon AI gateway are
committed in `.env.example`. Tracked in `tasks.md`; not fixed, because rotation happens in
external consoles.

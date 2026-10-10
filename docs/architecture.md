# Architecture

How the portfolio is put together, and why the load-bearing decisions were made the way they
are. This document describes the system as it exists in the code today.

## Overview

A single Next.js App Router application serves three things from one codebase:

| Surface | Route | Rendering | Purpose |
| --- | --- | --- | --- |
| Public site | `/` | Dynamic (SSR) | The animated single-page portfolio |
| Résumé | `/resume` | Dynamic (SSR) | A print-ready résumé view |
| Bosdik dashboard | `/bosdik` | Dynamic (SSR) | Access-code-protected editing UI |
| API | `/api/*` | Route handlers | Mutations, auth, message inbox |

All content lives in **one row**. `Portfolio` is a single-record table (`id` is pinned to `1`)
whose `content` column holds the entire site document as a JSON string. There is no per-section
table and no join graph — the sections are edited independently in the UI, but persisted
together.

This is a deliberate trade for a single-author site: one row means one transaction, one backup,
and no possibility of sections drifting out of sync. The cost is that every read loads the full
document, which is a few KB and irrelevant at this scale.

### Stack

- **Next.js 16** (App Router, React 19) — `npm run dev` uses webpack; `next build` uses Turbopack.
- **TypeScript** in `strict` mode, with `@/*` mapped to `src/*`.
- **Prisma 6** against **Neon Postgres**.
- **iron-session** for stateless cookie sessions.
- **bcryptjs** for access-code hashing, **nodemailer** for contact-form alerts.

## Directory layout

```
src/
  app/            Routes and route handlers (the only place Next.js conventions apply)
    api/          admin/security, auth/*, messages/*, portfolio
  features/       Feature-owned UI; each component sits beside its own CSS
    portfolio/    Public site: PortfolioApp plus one folder per section
    bosdik/       Admin dashboard shell + sections/ (one folder per editable section)
  components/     UI shared by more than one feature (background/)

  data/           Default content used for seeding and as a render fallback
  hooks/          Active-section tracking and scroll animations
  lib/            Server-side logic: data access, auth, validation, security
  styles/         Design tokens, resets, shared primitives, and breakpoints
  types/          Shared TypeScript types
prisma/           Schema, PostgreSQL migrations, seed
scripts/          Admin CLI, test scripts and shims, dev helpers
docs/             This file and the other project documents
```

The split that matters: **`components/` and `features/` never talk to the database, and `lib/` never imports
React.** All data access is funnelled through `src/lib`, so security-relevant logic (auth,
validation, rate limiting) can be reviewed in one directory without wading through UI code.

### CSS organisation

Styles are split by owning folder. A stylesheet named after a component lives in that
component's directory (`features/portfolio/about/About.css`, `features/portfolio/resume/ResumeView.css`);
anything genuinely shared lives in `src/styles/`:

| File | Owns |
| --- | --- |
| `styles/theme.css` | Design tokens (`--bg`, `--mint`, `--display`, …) |
| `styles/reset.css` | Element resets and base typography |
| `styles/buttons.css` | Shared `.button` primitives |
| `styles/reveal.css` | Scroll-reveal base class and stagger steps |
| `styles/keyframes.css` | All shared `@keyframes` |
| `styles/responsive.css` | Every breakpoint, across all components |

`src/app/globals.css` is the single import point, because Next.js only permits global CSS to
be imported there. **Its import order is load-bearing**: `responsive.css` is last so its
media-query overrides win over the base rules they refine, and moving a component's rules into a
later-loading file would silently break the mobile layouts. This replaced a single 2083-line
`base.css`; the split was verified to reproduce the original cascade exactly.

## Data flow

A page read follows the same path every time:

```
src/app/page.tsx  (or layout.tsx generateMetadata)
  -> lib/portfolio.ts  getPortfolioContent()
       -> lib/prisma.ts  prisma.portfolio.findUnique({ where: { id: 1 } })
            -> Neon Postgres
```

`getPortfolioContent()` parses the stored JSON and runs it through
`normalizePortfolioContent()`. If the row is missing it seeds from `src/data/personal`; if the
stored JSON is malformed or fails validation it **falls back to defaults without overwriting
the record**. That last behaviour is intentional: silently rewriting the row would destroy the
owner's real content the first time a validation rule tightened or a field drifted. The
dashboard is where a repair is meant to happen.

Writes go through `savePortfolioContent()`, which uses an `upsert` so a save is idempotent.

## Data model

Four tables, all defined in `prisma/schema.prisma`:

- **`Portfolio`** — the single JSON content document described above.
- **`Admin`** — one row. Holds `accessCodeHash` (bcrypt), optional `totpSecret`/`totpEnabled`
  for authenticator-app 2FA, and `sessionVersion`.
- **`LoginAttempt`** — rate-limit buckets keyed by a SHA-256 hash of the client address.
- **`ContactMessage`** — the public contact-form inbox.

Note the legacy SQLite migrations in `prisma/sqlite-migrations/` and the old `prisma/dev.db`.
Both are **inert** and preserved only for reference; Prisma deploys only the PostgreSQL
migrations in `prisma/migrations/`.

### Session revocation without a session store

`Admin.sessionVersion` is the mechanism that lets this app revoke sessions while keeping
sessions stateless. Each cookie carries the `sessionVersion` it was issued with;
`hasAdminAccess()` compares it against the current stored value. Bump the column and every
previously-issued cookie stops validating immediately, on every device, with no server-side
session table and no invalidation list.

Changing the access code increments `sessionVersion`. `npm run admin:reset-code` does the same,
which is why losing the code locks you out of every device until you run it from a terminal.

## Authentication

Sign-in uses a **single access code**, not an email/password pair:

1. `POST /api/auth/login` — same-origin check, rate-limit check, bcrypt compare.
2. If `totpEnabled`, the session is written as *pending* (`pendingAdminId`, `pendingTotpUntil`)
   rather than authenticated, and the client must supply a current 6-digit code to
   `POST /api/auth/totp`.
3. Otherwise `session.adminId = 1` and the version is pinned.

Code policy lives in `src/lib/access-code.ts` and is applied identically by the API and the
`admin:reset-code` CLI: at least 20 characters, at least 10 distinct characters, no sequential
or repeated patterns, and not on the weak-code list. Codes are compared after normalisation
(trimmed, whitespace collapsed, upper-cased) so a capitalisation slip cannot lock you out. Only
the bcrypt hash is ever stored.

Sessions are sealed cookies (`portfolio.sid`, `httpOnly`, `sameSite: strict`, `secure` in
production, 8-hour TTL) encrypted with `SESSION_SECRET`. `getAdminSession()` refuses to issue a
session if that secret is shorter than 32 characters or still contains a placeholder value, so a
misconfigured deployment fails loudly instead of running on a guessable key.

## Security model

The threat model is a single-author site reachable from the public internet, so the design
optimises for "an attacker can reach every endpoint".

**Request-level defences** (`src/lib/security.ts`)

- **CSRF** — every state-changing route calls `hasSameOrigin()`, which checks both `Origin`
  *and* `Sec-Fetch-Site` before any work is done.
- **Client address trust fails closed.** `X-Forwarded-For` is ignored unless an operator sets
  `TRUST_PROXY_HEADERS=true`, and unresolvable clients collapse into one shared bucket rather
  than each getting a fresh one. Setting the variable on a directly-reachable app would let an
  attacker rotate the header and bypass rate limiting entirely.
- **Body size limits** are checked twice — against `content-length` *and* against the
  serialised payload — so a chunked request cannot bypass the cap. Contact messages also have
  a 30,000-character message-field limit.

**Rate limiting** (`src/lib/auth-rate-limit.ts`)

- Sign-in: 10 attempts / 15 min per address, plus a shared ceiling of 200 so rotating
  `X-Forwarded-For` cannot buy unlimited attempts.
- Contact messages: 5 / 15 min.
- Bucket keys are SHA-256 hashes salted with `SESSION_SECRET`, so the table never stores a raw
  address.

**Input validation** (`src/lib/validations.ts`)

Every admin-supplied string has a length cap and is rejected if it contains control characters
(tab, newline and carriage return are allowed — they are legitimate in prose). URLs must be
`http`/`https`, which blocks `javascript:` and `data:` sources. Arrays are capped in length.
The caps in `PORTFOLIO_LIMITS` sit far above anything the live record needs, so tightening
validation can never invalidate content that is already stored.

**Response headers** (`src/lib/security-headers.ts` + `next.config.ts`)

Static headers are applied to every response; a per-request nonce-based CSP is added by the
 proxy layer. `/bosdik/*` and `/api/*` additionally send `no-store`, and
`/bosdik/*` sends `X-Robots-Tag: noindex`. The Bosdik security dashboard reads its own response headers back and
reports on them, so header regressions surface in the UI instead of going unnoticed.

**Development relaxes `style-src`.** `npm run dev` runs `next dev --webpack`, whose `style-loader`
creates a `<style>` element and writes its text from JavaScript rather than emitting a stylesheet
link. A strict `style-src` therefore blocks every dev CSS rule and logs one violation per chunk
(`index.js` in the dev bundle, at `injectStylesIntoStyleTag`). `'unsafe-inline'` is added to
`style-src` and `style-src-attr` **only** when `NODE_ENV !== "production"`, matching the existing
`'unsafe-eval'` allowance on `script-src`. `contentSecurityPolicyIsStrict()` evaluates the
*production* policy via an internal `buildPolicy(nonce, development)` parameter, so the dashboard
reports the posture that actually reaches browsers rather than a permanent local false failure.

**Network exposure**

`npm run dev` and `npm run start` bind to **localhost only**. The `dev:lan`/`start:lan`
variants refuse to bind `0.0.0.0` without an explicit `ALLOW_PUBLIC_DEV=1` opt-in, because a
development build carries source maps, verbose error overlays and relaxed headers.

## Database resilience

Neon suspends the compute while idle and resumes it on the first connection to arrive. That
first connection can be refused or dropped **while the compute wakes**, which produced
intermittent `PrismaClientInitializationError` failures and 500s on the homepage even though
the database itself was healthy.

`src/lib/db-retry.ts` addresses this with `withDatabaseRetry()`: exponential backoff with full
jitter, retrying **only** transient connectivity failures (`P1001`, `P1002`, `P1008`, `P1017`,
`P2024`, `P2028`, `P2034`, plus socket-level codes like `ECONNRESET`). Permanent failures —
unique violations, not-found, a missing or malformed `DATABASE_URL` — are rethrown immediately
rather than delayed behind pointless retries.

**Only replay-safe operations are wrapped.** Reads and idempotent writes (upserts) always are. A
plain `create` is not: the first attempt may have committed before the connection dropped, so
retrying it risks duplicating a contact message. `withDatabaseRetry()` is applied to the
portfolio read and save, the seed lookup, and the auth read paths — including
`hasAdminAccess()`, where an un-retried blip would otherwise look like a revoked session and
eject the administrator.

Measured on the development machine: warm queries complete in ~215-290 ms, cold ones took
2.3-10.8 s with roughly a 1-in-5 failure rate before this was added.

## Request lifecycle

The proxy layer (`proxy.ts`) runs on every request and is responsible for:

- Generating the CSP nonce and attaching it to the response.
- Applying `no-store` to authenticated and mutation responses.
- Refusing state-changing requests that fail the same-origin check, so the check runs before
  any route body and before any database work.

Because the origin check lives here, individual routes still repeat it as defence in depth —
a route reachable without the proxy should not silently lose the protection.

## Testing and verification

There is no test framework in this project. Verification is done with two purpose-built scripts
and the standard toolchain:

| Command | What it proves |
| --- | --- |
| `npm run typecheck` | Types are sound across the app (`tsc --noEmit`) |
| `npm run build` | The app compiles and all routes generate |
| `npm run test:db-retry` | Error classification and retry semantics, against real Prisma error classes |
| `npm run test:coldstart` | `getPortfolioContent()` survives repeated cold starts against the live database |

The two test scripts load `scripts/shims/shim-server-only.cjs`, which maps the `server-only` specifier
to an empty module. That package is supplied by Next.js at build time and is absent from
`node_modules`, so a bare `tsx` run cannot otherwise resolve the `import "server-only"` guard
that the rest of `src/lib` uses.

`npm run build` runs `prisma generate` first, which rewrites the Prisma query engine binary. On
Windows that step fails with `EPERM` if a `next dev` process is still running and holding the
DLL — stop the dev server before building.

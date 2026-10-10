# Engineering Rules

Conventions this codebase follows. These are observed from the existing code, not invented —
when a rule here and the surrounding code disagree, the code wins and this document is wrong.

## Layering

**`components/` and `features/` never import Prisma. `lib/` never imports React.** Components receive content
as props; all data access is funnelled through `src/lib`. This keeps security-relevant logic
reviewable in one directory.

**`app/` is the only place Next.js conventions apply.** Route files stay thin: validate, call
into `lib/`, shape the response.

**Shared types live in `src/types/`.** `PortfolioContent` and friends are imported from
`@/types`, never redefined at the point of use.

## `server-only` on server modules

Anything under `src/lib` that must never reach the browser starts with:

```ts
import "server-only";
```

This is a compile-time guard, not documentation. It is omitted **only** where a client
component genuinely needs the module — `access-code.ts` is the deliberate exception, and its
header comment says so. Because `server-only` is supplied by Next.js and is not in
`node_modules`, scripts run under plain `tsx` need the shim in `scripts/shims/shim-server-only.cjs`.

## Client components

Anything with `useState`, `useEffect`, or event handlers starts with `"use client"`. Pages that
only fetch and render stay server components — `PortfolioApp` is the boundary where the public
site becomes interactive.

## Comments explain *why*, not *what*

The house style is a comment above the code stating the reasoning and the trade-off. Comments
routinely record why a non-obvious choice was made and what would break if it changed:

```ts
// Only seed when there is genuinely no record. If a record exists but cannot be
// normalised we deliberately leave it untouched: overwriting it here would destroy the
// owner's real content the first time validation tightened or a field drifted.
```

Do not write comments that restate the code. Prefer naming the constraint ("`content-length` is
absent for chunked requests and can be spoofed by a client that streams its body").

## Security defaults

These are not preferences. Changing one without understanding the threat model is a regression.

- **Fail closed.** Untrusted input defaults to rejected. `TRUST_PROXY_HEADERS` is ignored
  unless explicitly `"true"`.
- **Secrets never reach the browser.** Return length, algorithm, or a boolean — never the value.
- **Every state-changing route calls `hasSameOrigin()` first**, before parsing a body or touching
  the database.
- **Validate and cap everything.** Every admin-supplied string has a length limit and a
  control-character check. Limits sit well above real content so tightening them can never
  invalidate stored data.
- **Only `http`/`https` URLs.** This is what blocks `javascript:` and `data:` sources.
- **Rate limits are hashed**, salted with `SESSION_SECRET`, never stored as raw addresses.
- **Development servers bind to localhost.** The `*:lan` scripts require `ALLOW_PUBLIC_DEV=1`
  and refuse to run without it.
- **Error responses are generic.** Sign-in must not reveal whether an account exists.

## Data access

- All reads and writes go through the helpers in `src/lib/portfolio.ts`. Route handlers do not
  call Prisma directly for content.
- **Wrap only replay-safe operations in `withDatabaseRetry()`.** Reads and idempotent writes
  (upserts) qualify. A plain `create` does not — the first attempt may have committed before
  the connection dropped, so a retry can duplicate it.
- **Never overwrite a stored record to "fix" it.** If content fails validation, render defaults
  and log. Repair is a deliberate re-save from the dashboard.
- Use the pooled `DATABASE_URL` at runtime and `DATABASE_URL_UNPOOLED` for migrations.

## TypeScript

`strict` is on. Prefer narrowing type guards (`isRecord`, `isPortfolioContent`) over casts. Use
`unknown` at trust boundaries and validate before use. `NodeJS.ErrnoException` is the idiom for
reading a `code` property off an unknown error.

## CSS

- **All colour comes from `theme.css` custom properties.** Never hard-code a hex value in a
  component stylesheet.
- **Motion is CSS transitions**, not a JavaScript animation library.
- **Responsive rules go in `src/styles/responsive.css`**; component-specific CSS lives beside
  its component in its own folder (`features/portfolio/about/About.css`).
- **`src/app/globals.css` is the only place CSS is imported,** and its order is load-bearing —
  `responsive.css` must stay last so its media queries override the base rules. Adding a
  stylesheet means adding an `@import` there in the correct position, not appending blindly.
- Transitions stay in the ~0.2s range and respect `prefers-reduced-motion`.

## Errors and logging

Log server-side with `console.error`/`console.warn` and a message that says what failed and
where. Never log a secret, an access code, or a session cookie. Errors crossing the HTTP
boundary become short, non-revealing strings — the detail stays in the server log.

## Before calling a change done

```sh
npm run typecheck
npm run build
```

`npm run build` runs `prisma generate` first, which fails with `EPERM` on Windows if a
`next dev` process is still holding the query-engine DLL. Stop the dev server first.

When touching database access, `npm run test:db-retry` and `npm run test:coldstart` must pass.

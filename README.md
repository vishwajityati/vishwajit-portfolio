# Vishwajit Yati Portfolio

A full-stack portfolio built with Next.js App Router, TypeScript, Prisma, and Neon Postgres. The portfolio has a responsive animated public site, an access-code-protected admin dashboard, and a print-ready résumé.

## Requirements

- Node.js 20.9 or newer (Node.js 22+ recommended)
- npm

## Local development

1. Install dependencies from the project root:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env`, then link this workspace to your Neon project and pull its connection strings:

   ```sh
   neon link --project-id <project-id> --branch production --no-env-pull -y
   neon env pull
   ```

   `DATABASE_URL` is the pooled app connection; `DATABASE_URL_UNPOOLED` is used for migrations. Set `SESSION_SECRET` to a random value with at least 32 characters. Keep all secrets private.
3. Apply the PostgreSQL migrations and populate the initial portfolio record:

   ```sh
   npm run db:migrate
   npm run db:seed
   ```

4. Start the app:

   ```sh
   npm run dev
   ```

5. Open `http://localhost:5173`. Go to `/update-section` to create the first administrator account. There are no default credentials; the one-time first account requires a strong access code.

The legacy SQLite migrations are preserved in `prisma/sqlite-migrations/` for reference; Prisma deploys only the PostgreSQL migrations in `prisma/migrations/`. The old local database at `prisma/dev.db` is not used by the Neon-backed app.

If you forget the admin access code, run `npm run admin:reset-code` from an interactive terminal in the project root. It uses the database configured by `DATABASE_URL`, displays the target host and database (never the connection credentials), and requires typing `RESET` before proceeding. Enter and confirm the new access code when prompted; it is hidden while typing. The command keeps the existing admin email and preserves authenticator verification unless you explicitly disable it. If you can already sign in, you can change the access code in **Admin → Access Code**.

To add authenticator-app two-factor verification, deploy the database migration with `npm run db:deploy`, sign in as admin, and open **Settings → Two-Factor Auth**. The secret is encrypted in the database using `SESSION_SECRET`; keep that setting stable and backed up, then add the shown key to an authenticator app as a time-based 6-digit code. Confirm with a current code to enable it. Admin sign-in then requires both the access code and a valid authenticator code.

## Project structure

- `prisma/` — PostgreSQL schema and migrations, and initial seed data.
- `public/images/` and `public/resume/` — static images and résumé assets.
- `src/app/` — Next.js pages, layouts, and API route handlers.
- `src/components/` — public portfolio sections, résumé views, and the admin dashboard.
- `src/components/admin/sections/` — dashboard overview, portfolio editors, messages, profile, social links, and settings panels.
- `src/data/` — initial portfolio content.
- `src/hooks/` — active-section and scroll-animation hooks.
- `src/lib/` — Prisma client, authentication, permissions, validation, and data access.
- `src/styles/` — design tokens, resets, shared primitives (buttons, reveal, keyframes) and breakpoints.
- `src/types/` — application content types.
- `docs/` — project design and implementation documentation.

## Managing portfolio content

Sign in to `/update-section` to use the sidebar dashboard. Portfolio sections, profile/contact details, social links, SEO, and site settings are edited independently and saved to the portfolio record. SEO title/description/keywords and the social preview image are used for generated page metadata. Admin email and access-code updates require the current access code. Projects and experience entries can be added or removed without editing JSON. Project screenshots use each project's `imageUrl`; a profile photo uses `photoUrl`; and an optional résumé file or hosted URL uses `resumeUrl`.

If `resumeUrl` is empty, `/resume` displays a print-ready résumé based on your saved portfolio content. Choose **Download as PDF** to save it using the browser's print dialog.

Visitor messages from the contact form are saved in the private **Messages** inbox in `/update-section`; mark them read or unread, delete them, or reply by email. To receive automatic email alerts, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASSWORD` in the private project-root `.env` file (or your hosting provider's environment settings), then restart/redeploy the app. Set `CONTACT_EMAIL_TO` to the inbox where you want alerts; if it is blank, notifications go to the admin account email. Optionally set `SMTP_FROM` to the authenticated sender address. For Gmail, use `smtp.gmail.com`, port `587`, your email account for `SMTP_USER`, and a Google App Password for `SMTP_PASSWORD`; do not use your regular account password. Spaces in Gmail App Passwords are removed automatically. Email settings stay on the server and are never exposed by the inbox API. Without working SMTP settings, messages are still saved in the admin inbox, but no email alert is sent.

Apply the contact-message table migration to your database before using the inbox:

```sh
npm run db:deploy
```

## Security

Sign in and open **Settings → Security Status** for a live security report. It is computed on every request from your real database rows and server configuration: database connectivity and latency, the bcrypt cost actually stored for your password, the rate-limit buckets recorded in the `LoginAttempt` table, whether authenticator verification is on, and whether the required response headers are configured. Nothing is cached or hard-coded, so the report always reflects the deployment you are running. Secrets are never returned to the browser — only their length, algorithm or a boolean.

The hardening applied in this codebase:

- **Response headers** — CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and (in production) HSTS. The static half lives in `src/lib/security-headers.ts` and is applied by `next.config.ts`.
- **Content-Security-Policy** — issued per request by `src/proxy.ts` with a fresh nonce. The nonce is passed to the framework through the request header, so Next.js stamps it onto every `<script>` it emits, and `script-src` is `'self' 'nonce-…' 'strict-dynamic'` with **no `'unsafe-inline'`**. `style-src` is equally strict and `style-src-attr` is `'none'`: the reveal-animation stagger uses fixed `.reveal-delay-*` classes instead of computed inline styles, and both project screenshots and the profile photo are a real `<img>` rather than an inline `background-image`. Neither script nor style can be injected inline.
  Every page is `force-dynamic`, which this depends on — a statically prerendered page would be emitted without a nonce and its scripts would be blocked.
  **Development is the one exception.** `npm run dev` uses `next dev --webpack`, which injects CSS through `style-loader`: it creates a `<style>` element and assigns its text from JavaScript, so there is no stylesheet link to allow-list and a strict `style-src` blocks every rule while logging one violation per CSS chunk. `style-src` and `style-src-attr` therefore add `'unsafe-inline'` **only** when `NODE_ENV !== "production"`. The production policy is unchanged and still carries no inline escape hatch for either script or style. The posture check reads the *production* policy, so the admin dashboard does not show a permanent false "fail" locally.
  `npm run test:csp` enforces this. It renders `About` and `ProjectCard` with **populated** image URLs and asserts no inline styles reach the markup, because the violation only appears when those fields are set — a default-content render passes even with the bug present. It also scans `src/` for any `style={{…}}` so a new one is caught at review time rather than in the console.
- **Request size limits** — `/api/portfolio` rejects bodies over 256 KB and `/api/messages` over 32 KB, checked both against `content-length` and against the serialised payload so a chunked request cannot bypass it. Contact messages are also capped at 30,000 characters.
- **Content validation** — every admin-supplied string has a length cap and is rejected if it contains control characters (tab, newline and carriage return are allowed); URLs must be `http`/`https`, which blocks `javascript:` and `data:` sources; arrays are capped in length.
- **Rate limiting** — sign-in is capped at 10 attempts per 15 minutes per client address *and* at a shared ceiling of 200, so rotating `X-Forwarded-For` cannot buy unlimited attempts. Contact messages are capped at 5 per 15 minutes. Bucket keys are SHA-256 hashed with `SESSION_SECRET`, so the table never stores raw addresses.
- **Client address trust** — `TRUST_PROXY_HEADERS` now **fails closed**: forwarding headers are ignored unless an operator sets it to `"true"`. Clients whose address cannot be resolved share one bucket instead of getting a fresh one per forged header. Set it to `"true"` only when a proxy or CDN overwrites `X-Forwarded-For`.
- **Access codes** — sign-in uses a single access code instead of an email and password pair. New codes must be at least 20 characters, use at least 10 distinct characters, avoid sequential or repeated patterns, and must not appear in the weak-code list. The rules live in `src/lib/access-code.ts` and are applied identically by the API and the `admin:reset-code` CLI. Codes are compared after normalisation (trimmed, whitespace collapsed, upper-cased) so that a capitalisation slip cannot lock you out, and only the bcrypt hash is ever stored.
- **Session revocation** — changing your access code increments `Admin.sessionVersion` and destroys the current cookie, which signs out every other device immediately. `npm run admin:reset-code` does the same, and no longer disables your authenticator unless you explicitly type `DISABLE`. Because there is no email recovery path, that CLI is the only way back in if the code is lost.
- **CSRF** — every state-changing route checks both `Origin` and `Sec-Fetch-Site` before doing any work.

### Never expose a development server

`npm run dev` and `npm run start` bind to **localhost only**. The previous scripts bound `0.0.0.0`, which put a development build — with source maps, verbose error overlays and relaxed security headers — on every network interface, and directly on the Internet behind a `cloudflared` tunnel.

If you genuinely need LAN or tunnel access, use the guarded variants, which refuse to run without an explicit opt-in:

```sh
ALLOW_PUBLIC_DEV=1 npm run dev:lan
```

Put an authenticating reverse proxy or Cloudflare Access in front of it. Never point a tunnel at an unguarded dev server.

`sessionVersion` is a new column. Apply it before running the new code:

```sh
npm run db:deploy
```

### Rotating a leaked secret

If `SESSION_SECRET` or the database password is ever committed or shared, rotate it. Changing `SESSION_SECRET` invalidates every active session and makes existing encrypted authenticator secrets unreadable, so re-enable two-factor afterwards.

## Production

```sh
npm run build
npm start
```

Set `NODE_ENV=production`, configure a long random `SESSION_SECRET`, and provide the pooled Neon `DATABASE_URL` plus the direct `DATABASE_URL_UNPOOLED` connection for migrations. Apply schema changes with `npm run db:deploy`. Use HTTPS so the admin session cookie is secure.

Optionally set `FRONTEND_ORIGIN` to your production origin so state-changing requests are pinned to it, and `TRUST_PROXY_HEADERS=false` when no proxy or CDN overwrites `X-Forwarded-For` in front of the app.

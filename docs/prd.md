# Product Requirements Document

The product goal, the users it serves, and the constraints it must respect. This describes
**what** the portfolio is for; `architecture.md` describes **how** it is built.

## Product goal

A single-developer portfolio that is:

1. **Editable without a deploy.** The owner updates projects, experience, contact details, SEO
   and site settings from an authenticated dashboard, and the change is live immediately.
2. **Fast and animated on mobile.** A single scrolling page with scroll-triggered reveals and a
   fixed bottom navigation bar, because the primary audience reaches it from a phone.
3. **Presentable as a document.** A print-ready résumé route renders the same content in a
   layout suited to paper or PDF.
4. **Safe to expose publicly.** Every endpoint, including the contact form, is reachable by
   anyone on the internet.

## Users

| User | Need | Entry point |
| --- | --- | --- |
| Visitor | Skim skills, projects and experience; get in touch | `/` |
| Recruiter / client | Read a focused, printable summary | `/resume` |
| Owner | Edit all site content; read contact messages | `/badmash-studio` |

There is exactly one account type. There are no visitor accounts, no comments, and no
registration — the app is a publishing surface plus a private editor, not a community product.

## Scope

### In scope

- Single-page public site: hero, about, skills, education, projects, experience, contact.
- Résumé view with print styling.
- Admin dashboard with per-section editing of all portfolio content.
- Contact form that stores messages and sends an email alert.
- Single-administrator authentication with an access code and optional TOTP 2FA.
- Security status dashboard reporting the live posture of the running deployment.
- SEO metadata and Open Graph / Twitter cards generated from editable fields.

### Explicitly out of scope

- Multiple administrators, roles, or permissions beyond "signed in or not".
- Public visitor accounts, comments, or user-generated content other than contact messages.
- Email delivery of messages to visitors (messages are stored; only the owner is notified).
- Analytics or third-party tracking scripts.
- Public API for portfolio content beyond the authenticated `/api/portfolio` used by the
  dashboard.

## Functional requirements

### Content management

- Every section of the public site is editable from the dashboard and persisted.
- Sections save independently; the whole document is validated before any save is accepted.
- Projects and experience entries can be added and removed without hand-editing JSON.
- SEO title, description, keywords and social preview image feed generated page metadata.
- If stored content cannot be validated at read time, the site **renders defaults and leaves
  the stored record untouched** — a bad record must never silently destroy the owner's real
  content. Repair happens by re-saving from the dashboard.

### Authentication

- Sign-in uses a **single access code**; there are no default credentials.
- The first visit offers one-time setup to create the initial administrator.
- New codes must satisfy a strength policy: at least 20 characters, at least 10 distinct
  characters, no sequential or repeated patterns, and not on the weak-code list.
- Codes are compared case-insensitively after trimming and whitespace collapsing.
- Optional authenticator-app (TOTP) 2FA; when enabled, sign-in requires the code *and* a
  current 6-digit TOTP code.
- Changing the access code revokes all other sessions immediately.
- There is **no email recovery path**. `npm run admin:reset-code` from an interactive terminal
  is the only way back in, which is a deliberate consequence of not collecting an email.

### Contact form

- Visitors submit name, email, optional phone and a message.
- Submissions are stored and appear in the dashboard inbox with read/unread state.
- The owner receives an email alert when SMTP is configured; if it is not, messages are still
  stored.

### Security posture reporting

- The dashboard reports live, uncached facts about the running deployment: database
  connectivity and latency, the bcrypt cost actually stored, rate-limit bucket state, whether
  2FA is enabled, and whether required response headers are present.
- Secrets are never returned to the browser — only length, algorithm, or a boolean.

## Non-functional requirements

**Security.** Treat every endpoint as attacker-reachable. No secrets in responses. Validate and
cap all input. Rate-limit sign-in and contact submission. Enforce CSRF checks on every
state-changing route. Bind development servers to localhost only.

**Performance.** Public pages are server-rendered per request so content edits appear
immediately. Database queries are retried on transient connectivity failures so a cold database
does not produce a 500.

**Accessibility.** Semantic section elements, labelled controls, visible focus states, and
reduced-motion support for the scroll animations.

**Responsiveness.** Mobile-first; the navigation is a fixed bottom bar on small screens.

**Privacy.** Only what the site needs is collected: contact-form submissions and the
hashed rate-limit buckets. No third-party analytics.

## Constraints

- Single author, single deployment. Optimise for operational simplicity over multi-tenancy.
- Neon Postgres with a pooled runtime connection and a direct connection for migrations.
- Content is a single JSON document in one row — acceptable at this scale, and revisited only
  if content grows substantially or needs relational querying.
- Secrets live in environment variables and must never be committed.

## Success criteria

- The owner can change any piece of site content and see it live without a rebuild.
- The public site renders correctly on a phone, a desktop, and in print.
- An unauthenticated visitor cannot read or modify anything but the public site and the contact
  form.
- Sign-in cannot be brute-forced in bulk, and losing the access code has a documented recovery
  path.
- No 500s caused by transient database unavailability.

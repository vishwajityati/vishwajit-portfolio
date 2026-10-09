# Design Document

The user-facing design: visual language, layout, motion, and the behaviour of the admin
dashboard. `architecture.md` covers the server side; `prd.md` covers intent.

## Design intent

A portfolio that reads as a **calm technical document**, not a marketing page. The reference
points are terminal output and well-set editorial print rather than glassmorphism or gradient
heroics. The site should feel fast and deliberate, with motion used to explain structure
rather than to decorate.

Three priorities, in order:

1. Legibility above all — dense information must stay readable on a phone.
2. Motion that communicates — reveals mark sections as they arrive; nothing loops or bounces.
3. Restraint — one accent colour, generous space, no competing calls to action.

## Visual language

**Palette** (`src/styles/theme.css`)

The theme is a dark, low-chroma surface with a single mint accent. All colour is defined as CSS
custom properties on `:root`, so the palette is changed in exactly one place.

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#080b11` | Page background, near-black with a blue cast |
| `--panel` | `#10151e` | Raised surfaces, cards, inputs |
| `--panel-soft` | `rgba(16,21,30,.72)` | Translucent panels over the animated background |
| `--text` | `#f1f1ed` | Body text, warm off-white |
| `--muted` | `#9299a6` | Secondary text |
| `--dim` | `#626b7a` | Tertiary text, footers, metadata |
| `--line` | `rgba(203,216,233,.13)` | Hairline borders throughout |
| `--mint` | `#a5f1c8` | The single accent — primary actions, success, focus |
| `--cyan` / `--purple` | `#76d9d1` / `#b9a2ff` | Sparing secondary accents for tags and charts |

Mint is the only colour that signals action or success. Cyan and purple appear as small doses
in tags and secondary indicators. Because the accent is used sparingly, a mint element reads
as interactive without any additional affordance.

**Typography**

Three families, each with a distinct job:

- **Space Grotesk** (`--display`) — headings and brand marks. Geometric, sets the tone.
- **DM Sans** — body copy and UI. Neutral and highly legible at small sizes.
- **DM Mono** (`--mono`) — labels, indices, metadata, and anything that is conceptually
  machine-generated (footer, section indices, status codes).

The mono-for-machine-data convention is load-bearing: it visually separates "content" from
"chrome" without needing boxes or rules. Fonts load from Google Fonts with `preconnect` hints
in `src/app/layout.tsx`.

Body text is small by design (10–12px for most UI) and compensated with generous line height
(~1.65). The density reads as precision rather than crampedness because spacing does the work
instead of font size.

## Layout

### Public site

A single scrolling page composed of seven sections in a fixed order — hero, about, skills,
education, projects, experience, contact — declared in `src/data/navigation.ts`. The section IDs in
that file are the single source of truth for navigation and for scroll observation.

Skills have their own section because the dashboard has always had a dedicated Skills panel; they
used to render only as tags inside the education card, which buried them in the third section. The
values live on `education.skillGroups` in storage — each group has a `title` and a list of
`{ name, level }` — so only the presentation moved.

Proficiency bars are drawn from stepped `.skill-bar-N` classes (0–100 in 5% increments) rather
than an inline `width`, for the same reason the reveal stagger uses `.reveal-delay-*`: an inline
width would require `style-src 'unsafe-inline'`, which the production policy withholds. `snapSkillLevel()`
rounds the stored value to the nearest step so a matching class always exists.

Skills were a flat `string[]` before this change. `normalizePortfolioContent` migrates a stored
record of that shape into a single `Skills` group rather than rejecting it — otherwise the record
would read as malformed and the site would silently fall back to the seed content, showing the
owner someone else's skill list.

The section kicker numbers are hard-coded per component (`01`…`06`), so inserting a section means
renumbering the ones after it.

Content sits in a centred shell (`.section-shell`) with a maximum width, so line lengths stay
readable on wide monitors. Vertical rhythm comes from consistent section padding rather than
per-section margins.

**Bottom navigation.** The primary navigation is a fixed, centred pill at the bottom of the
viewport rather than a top bar. This is a deliberate mobile-first choice: it sits within thumb
reach, and it does not compete with the browser chrome at the top of the screen. It uses
`env(safe-area-inset-bottom)` so it clears the home indicator on iOS, and a translucent
background with `backdrop-filter: blur(18px)` so content scrolling beneath stays legible.

### Résumé

`/resume` renders the same content through a separate `ResumeView` component optimised for
paper: single column, restrained colour, and print-specific rules. It shares data with the
main site but shares no layout code, because a page tuned for a 390px viewport and a page
tuned for A4 have almost nothing in common.

### Admin dashboard

A sidebar-plus-panel layout. The sidebar switches between sections; only the active section is
mounted. Each section is a focused editor for one part of the content document, sharing
reusable primitives in `sections/shared/` (`BosdikField`, `BosdikTextList`, `SectionIntro`) so
that input markup, labelling, and error display are consistent everywhere.

## Motion

Two hooks in `src/hooks/` implement all scroll-driven behaviour. Both use
`IntersectionObserver` rather than scroll listeners, so they run off the main thread's
critical path.

**`useScrollAnimation`** — reveals elements marked `.reveal` as they enter the viewport
(threshold `0.13`). Each element is **unobserved after its first reveal**: animations play once,
on entry, and never replay. This keeps scrolling calm and avoids the distracting re-triggering
that a naive observer produces when scrolling back up.

**`useActiveSection`** — tracks which section occupies the middle of the viewport to highlight
the current nav item. The `rootMargin` of `-38% 0px -45% 0px` narrows the observed band to a
horizontal strip around the middle of the screen, so the active item changes when a section is
genuinely being read rather than merely scrolled past.

Motion is defined in CSS transitions rather than a JavaScript animation library, keeping the
bundle small and the timing consistent. Reduced-motion preferences are respected.

## Responsive behaviour

`src/styles/responsive.css` holds the breakpoints; everything else lives beside the component that
owns it, in a stylesheet named after it. The layout is mobile-first:

- Below 640px the bottom nav collapses to icons with tighter padding.
- The admin sidebar becomes a slide-over with a backdrop tap target.
- Grids collapse to a single column.
- Tap targets maintain a minimum height of ~43px for comfortable touch use.

## Background

`AnimatedBackground` renders a subtle animated layer behind all content. Because it sits under
text for the whole page, it stays low-contrast and slow — it exists to keep the dark surface
from feeling flat, not to be looked at. Panels that must stay readable use `--panel-soft`, a
translucent surface that lets the background show through without harming text contrast.

## Content and empty states

Because content is database-driven and may be empty during first-run setup, every section must
degrade gracefully. Optional fields (photo, résumé link, social links) render nothing rather
than an empty container. `src/types/index.ts` exports `emptyPortfolio` for exactly this case,
and it is what renders when no record exists.

## Icons

Icons come from `lucide-react` — a consistent stroke weight and grid, which matters more than
any individual icon choice. Icons are decorative by default and paired with text or an
`aria-label`; no icon carries meaning on its own.

## Accessibility

- Semantic `<section>` elements with stable IDs, so the document outline matches the nav.
- Interactive controls are real `<button>` and `<a>` elements, keyboard reachable, with
  visible focus states.
- The admin link on the public site is a low-contrast icon with an `aria-label`; it is
  intentionally unobtrusive but still reachable.
- Colour is never the only signal — status uses icons and text alongside the mint/amber/red
  tint in the security dashboard.

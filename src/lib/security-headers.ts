export interface SecurityHeader {
  key: string;
  value: string;
}

const isDevelopment = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy, built per request with a fresh nonce.
 *
 * The nonce is generated in `middleware.ts`, echoed to the framework through the request
 * header (which is how Next.js stamps its own hydration scripts) and returned to the
 * browser here. Because every script must carry that nonce, `'unsafe-inline'` is no
 * longer needed for `script-src` and injected inline scripts cannot execute.
 *
 * `'strict-dynamic'` lets the nonced Next.js bootstrap load its own chunks without those
 * chunk origins having to be allow-listed, so `script-src` carries no usable host source.
 *
 * `style-src` is likewise free of `'unsafe-inline'` in production: the reveal-animation stagger
 * uses fixed `.reveal-delay-*` classes instead of computed inline styles, and project
 * screenshots are a real `<img>` rather than an inline `background-image`. Next.js emits
 * stylesheet links, so no inline `<style>` element is needed either.
 *
 * Development is the exception. `next dev --webpack` injects CSS through `style-loader`, which
 * creates a `<style>` element and assigns its text from JavaScript (see `injectStylesIntoStyleTag.js`
 * in the dev bundle). There is no stylesheet link to allow-list, so a strict `style-src` blocks
 * every rule and logs one violation per CSS chunk. `'unsafe-inline'` is therefore added to
 * `style-src` **only** when `NODE_ENV !== "production"`; the production policy is unchanged and
 * still carries no inline escape hatch for either script or style.
 */
export function buildContentSecurityPolicy(nonce: string): string {
  return buildPolicy(nonce, isDevelopment);
}

/**
 * The policy itself, parameterised by environment so the production posture can be asserted
 * directly (see `contentSecurityPolicyIsStrict`) without string surgery.
 */
function buildPolicy(nonce: string, development: boolean): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' https://fonts.googleapis.com${development ? " 'unsafe-inline'" : ""}`,
    `style-src-attr${development ? " 'unsafe-inline'" : " 'none'"}`,
    "font-src 'self' https://fonts.gstatic.com data:",
    // Portfolio imagery is admin-supplied and may be hosted anywhere.
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://vercel.com https://*.blob.vercel-storage.com",
    "manifest-src 'self'",
    ...(development ? [] : ["upgrade-insecure-requests"])
  ].join("; ");
}

/**
 * True when neither script nor style execution may rely on an inline escape hatch.
 * Reported by the admin security dashboard.
 *
 * This asserts the **production** posture, not whatever the current process emits. Development
 * deliberately relaxes `style-src` so webpack's `style-loader` can inject CSS (see
 * `buildContentSecurityPolicy`), so evaluating the live policy would show every local developer a
 * permanent, unfixable "fail". What reaches browsers in production is what counts, and that policy
 * has no `'unsafe-inline'` for either script or style.
 */
export function contentSecurityPolicyIsStrict(): boolean {
  const productionPolicy = buildPolicy("TESTNONCE", false);
  const directives = productionPolicy.split(";").map((directive) => directive.trim());
  const scriptDirective = directives.find((directive) => directive.startsWith("script-src")) ?? "";
  const styleDirective = directives.find((directive) => directive.startsWith("style-src")) ?? "";
  const styleAttrDirective = directives.find((directive) => directive.startsWith("style-src-attr")) ?? "";
  return scriptDirective.includes("'nonce-")
    && !scriptDirective.includes("'unsafe-inline'")
    && !styleDirective.includes("'unsafe-inline'")
    && styleAttrDirective === "style-src-attr 'none'";
}

/** Non-CSP headers. Applied to every response by `next.config.ts`. */
export const securityHeaders: SecurityHeader[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  ...(isDevelopment
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }])
];

/**
 * Header keys that must reach the browser for the posture check to pass.
 * `Content-Security-Policy` is emitted per request by middleware rather than statically,
 * so it is verified through `contentSecurityPolicyUsesNonceOnly()` instead.
 */
export const requiredSecurityHeaderKeys = [
  "X-Content-Type-Options",
  "X-Frame-Options",
  "Referrer-Policy",
  "Permissions-Policy"
] as const;

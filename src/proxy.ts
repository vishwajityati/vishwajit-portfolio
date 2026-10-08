import { NextRequest, NextResponse } from "next/server";
import { buildContentSecurityPolicy } from "@/lib/security-headers";

/**
 * Issues a per-request CSP nonce.
 *
 * The nonce is written to the *request* headers because that is how Next.js discovers it
 * and applies it to the framework's own `<script>` tags; the same policy is echoed on the
 * response so the browser enforces it. A fresh value per request also means a policy
 * cannot be reused across responses.
 *
 * Every page that renders the app is `force-dynamic`, which is required: a statically
 * prerendered page would be emitted without the nonce and its scripts would be blocked.
 */
export function proxy(request: NextRequest) {
  // btoa is available in both the Edge and Node runtimes; Buffer is not guaranteed here.
  const nonce = btoa(crypto.randomUUID());
  const policy = buildContentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: [
    {
      /*
       * Only HTML documents need the nonce. API responses are JSON, static assets are
       * served without scripts, and prefetch responses are discarded by the router, so all
       * are excluded to keep the overhead off the hot path.
       */
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|txt|xml)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" }
      ]
    }
  ]
};

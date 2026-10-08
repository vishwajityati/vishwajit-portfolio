/**
 * Refuses to run a command that binds to every network interface unless the operator
 * explicitly opts in.
 *
 * `next dev` and `next start` bound to 0.0.0.0 are reachable from the LAN and, behind a
 * tunnel such as `cloudflared`, straight from the Internet. A development build ships
 * source maps, verbose error overlays and relaxed security headers, so exposing one is a
 * serious disclosure. The default npm scripts bind to localhost only; these guarded
 * variants exist for the cases where a tunnel genuinely needs them.
 */

const optIn = process.env.ALLOW_PUBLIC_DEV === "1";

if (!optIn) {
  console.error(
    [
      "",
      "  Refusing to bind to all network interfaces (0.0.0.0).",
      "",
      "  A development or un-hardened server exposed publicly leaks source maps, error",
      "  overlays and framework internals. Run `npm run dev` instead — it binds to",
      "  localhost only.",
      "",
      "  If you genuinely need LAN or tunnel access, opt in explicitly:",
      "",
      "    ALLOW_PUBLIC_DEV=1 npm run dev:lan",
      "",
      "  ...and put an authenticating reverse proxy or Cloudflare Access in front of it.",
      "  Never point a tunnel at an unguarded dev server.",
      ""
    ].join("\n")
  );
  process.exit(1);
}

console.warn(
  "[guard] Binding to 0.0.0.0 because ALLOW_PUBLIC_DEV=1. Do not expose this to the public Internet without authentication."
);

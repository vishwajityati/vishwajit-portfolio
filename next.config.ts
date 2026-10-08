import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

const noStoreHeaders = [
  { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
  { key: "Pragma", value: "no-cache" }
];

const nextConfig: NextConfig = {
  agentRules: false,

  allowedDevOrigins: [
    "*.trycloudflare.com",
  ],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders.map(({ key, value }) => ({ key, value }))
      },
      {
        // The dashboard must never be indexed or cached.
        source: "/update-section/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
          ...noStoreHeaders
        ]
      },
      {
        // Auth and mutation responses must never be cached by a proxy or CDN.
        source: "/api/:path*",
        headers: noStoreHeaders
      }
    ];
  }
};

export default nextConfig;

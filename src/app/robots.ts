import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/resume"],
        disallow: ["/bosdik", "/bosdik/", "/admin", "/admin-dashboard", "/api/"]
      }
    ],
    sitemap: undefined
  };
}

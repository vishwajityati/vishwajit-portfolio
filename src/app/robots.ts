import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/resume"],
        disallow: ["/badmash-studio", "/badmash-studio/", "/admin", "/admin-dashboard", "/api/"]
      }
    ],
    sitemap: undefined
  };
}

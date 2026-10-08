import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/resume"],
        disallow: ["/update-section", "/update-section/", "/api/"]
      }
    ],
    sitemap: undefined
  };
}
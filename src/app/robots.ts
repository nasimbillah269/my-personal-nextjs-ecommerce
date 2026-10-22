import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/server/site-url";

/** /robots.txt — keeps crawlers out of private/admin areas and points them to the sitemap. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/account", "/cart", "/checkout", "/wishlist", "/login", "/register"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}

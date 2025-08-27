import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://qwip.pro/sitemap.xml",
    host: "https://qwip.pro",
  };
}

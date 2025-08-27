export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://qwip.pro/sitemap.xml",
    host: "https://qwip.pro",
  };
}

export default function sitemap() {
  const base = "https://qwip.pro";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/dashboard`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/vitrine`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
  ];
}

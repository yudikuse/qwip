import { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/site";

// IDs de anúncios que você já tem (mantenha alinhado ao que estiver listando)
const adIds = [1, 2, 3, 4, 5, 6];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/vitrine`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/dashboard`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const adPages: MetadataRoute.Sitemap = adIds.map((id) => ({
    url: `${BASE_URL}/anuncio/${id}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticPages, ...adPages];
}

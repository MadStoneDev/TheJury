import type { MetadataRoute } from "next";

const baseUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://thejury.app"
).replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes = [
    "/",
    "/pricing",
    "/templates",
    "/security",
    "/for/churches",
    "/for/clubs-and-associations",
    "/for/councils-and-government",
    "/for/businesses",
    "/for/presenters",
    "/terms",
    "/privacy",
    "/roadmap",
  ];

  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}

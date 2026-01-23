import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://peopleofcornwall.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/stories`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/map`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/timeline`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/collections`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Dynamic story pages
  let storyPages: MetadataRoute.Sitemap = [];
  
  if (supabase) {
    const { data: stories } = await supabase
      .from("stories")
      .select("id, updated_at, published_at")
      .eq("status", "published")
      .eq("soft_deleted", false)
      .order("published_at", { ascending: false })
      .limit(1000);

    if (stories) {
      storyPages = stories.map((story) => ({
        url: `${SITE_URL}/stories/${story.id}`,
        lastModified: new Date(story.updated_at || story.published_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    }
  }

  // Dynamic collection pages
  let collectionPages: MetadataRoute.Sitemap = [];
  
  if (supabase) {
    const { data: collections } = await supabase
      .from("collections")
      .select("id, created_at")
      .limit(100);

    if (collections) {
      collectionPages = collections.map((collection) => ({
        url: `${SITE_URL}/collections/${collection.id}`,
        lastModified: new Date(collection.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      }));
    }
  }

  // Dynamic author pages
  let authorPages: MetadataRoute.Sitemap = [];
  
  if (supabase) {
    const { data: authors } = await supabase
      .from("users")
      .select("id, created_at")
      .limit(500);

    if (authors) {
      authorPages = authors.map((author) => ({
        url: `${SITE_URL}/author/${author.id}`,
        lastModified: new Date(author.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.4,
      }));
    }
  }

  return [...staticPages, ...storyPages, ...collectionPages, ...authorPages];
}

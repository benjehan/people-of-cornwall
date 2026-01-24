import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://peopleofcornwall.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();

  // Fetch a recent featured photo for the OG image
  const { data: photo } = await (supabase
    .from("lost_cornwall") as any)
    .select("image_url, title, description")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const imageUrl = photo?.image_url || DEFAULT_OG_IMAGE;
  
  const description = "Explore historic photographs of Cornwall. Share memories, identify locations, and help preserve Cornwall's visual heritage.";

  return {
    title: "Lost Cornwall | Historic Photos & Memories | People of Cornwall",
    description,
    openGraph: {
      title: "Lost Cornwall — Historic Photos & Memories",
      description,
      type: "website",
      url: `${SITE_URL}/lost-cornwall`,
      siteName: "People of Cornwall",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "Lost Cornwall - Historic Photos",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Lost Cornwall — Historic Photos & Memories",
      description,
      images: [imageUrl],
    },
  };
}

export default function LostCornwallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

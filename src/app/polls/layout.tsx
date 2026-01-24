import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://peopleofcornwall.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();

  // Fetch active polls count
  const { count: activeCount } = await (supabase
    .from("polls") as any)
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Try to get a featured poll or recent winner with image
  const { data: featuredPoll } = await (supabase
    .from("polls") as any)
    .select(`
      title,
      poll_nominations (
        image_url
      )
    `)
    .eq("is_active", true)
    .not("poll_nominations.image_url", "is", null)
    .limit(1)
    .single();

  const imageUrl = featuredPoll?.poll_nominations?.[0]?.image_url || DEFAULT_OG_IMAGE;
  
  const description = activeCount && activeCount > 0
    ? `${activeCount} active polls! Vote for Cornwall's best pubs, cafes, beaches, and more. Have your say and help crown the winners!`
    : "Vote for Cornwall's best places! Join our community polls to nominate and vote for the best pubs, cafes, beaches, and hidden gems.";

  return {
    title: "Community Polls | Vote for Cornwall's Best | People of Cornwall",
    description,
    openGraph: {
      title: "Community Polls — Vote for Cornwall's Best",
      description,
      type: "website",
      url: `${SITE_URL}/polls`,
      siteName: "People of Cornwall",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "Community Polls - Vote for Cornwall's Best",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Community Polls — Vote for Cornwall's Best",
      description,
      images: [imageUrl],
    },
  };
}

export default function PollsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

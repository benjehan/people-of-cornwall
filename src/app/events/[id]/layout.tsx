import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://peopleofcornwall.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch event data
  const { data: event } = await (supabase
    .from("events") as any)
    .select("*")
    .eq("id", id)
    .eq("is_approved", true)
    .single();

  if (!event) {
    return {
      title: "Event Not Found | People of Cornwall",
      description: "This event could not be found.",
    };
  }

  // Fetch primary image
  const { data: images } = await (supabase
    .from("event_images") as any)
    .select("image_url, is_primary")
    .eq("event_id", id)
    .order("is_primary", { ascending: false })
    .limit(1);

  const imageUrl = images?.[0]?.image_url || event.image_url || DEFAULT_OG_IMAGE;
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const description = event.description 
    ? event.description.slice(0, 160) + (event.description.length > 160 ? "..." : "")
    : `${event.title} - ${formatDate(event.starts_at)} in ${event.location_name}. Discover events in Cornwall.`;

  return {
    title: `${event.title} | Events | People of Cornwall`,
    description,
    openGraph: {
      title: event.title,
      description,
      type: "article",
      url: `${SITE_URL}/events/${id}`,
      siteName: "People of Cornwall",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      images: [imageUrl],
    },
  };
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

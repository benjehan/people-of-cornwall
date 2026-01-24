import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://peopleofcornwall.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();

  // Fetch active challenge for dynamic image
  const { data: challenge } = await (supabase
    .from("where_is_this") as any)
    .select("image_url, hint")
    .eq("is_active", true)
    .eq("is_revealed", false)
    .single();

  const imageUrl = challenge?.image_url || DEFAULT_OG_IMAGE;
  const hint = challenge?.hint ? ` Hint: ${challenge.hint}` : "";
  
  const description = `Can you identify this mystery location in Cornwall?${hint} Test your local knowledge and compete with others!`;

  return {
    title: "Where Is This? | Cornwall Location Challenge | People of Cornwall",
    description,
    openGraph: {
      title: "Where Is This? — Cornwall Location Challenge",
      description,
      type: "website",
      url: `${SITE_URL}/where-is-this`,
      siteName: "People of Cornwall",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "Where Is This? Mystery Location in Cornwall",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Where Is This? — Cornwall Location Challenge",
      description,
      images: [imageUrl],
    },
  };
}

export default function WhereIsThisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

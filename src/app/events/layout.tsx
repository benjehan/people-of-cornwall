import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://peopleofcornwall.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export const metadata: Metadata = {
  title: "Events in Cornwall | What's On | People of Cornwall",
  description: "Discover upcoming events across Cornwall. From festivals and food fairs to music, arts, and community gatherings. Find something to do in Cornwall today!",
  openGraph: {
    title: "Events in Cornwall — What's On",
    description: "Discover upcoming events across Cornwall. From festivals and food fairs to music, arts, and community gatherings.",
    type: "website",
    url: `${SITE_URL}/events`,
    siteName: "People of Cornwall",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Events in Cornwall",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Events in Cornwall — What's On",
    description: "Discover upcoming events across Cornwall. From festivals and food fairs to music, arts, and community gatherings.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

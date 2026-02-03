import type { Metadata } from "next";
import { Source_Serif_4, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://peopleofcornwall.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.svg`;

export const metadata: Metadata = {
  title: {
    default: "People of Cornwall — A Living Archive of Cornish Voices",
    template: "%s | People of Cornwall",
  },
  description:
    "A community-driven storytelling platform preserving the voices, memories, and lived experiences of Cornwall. Share a story, explore by place and time, and help build a living digital museum.",
  keywords: [
    "Cornwall",
    "Cornish stories",
    "community archive",
    "oral history",
    "storytelling",
    "digital museum",
    "local history",
    "Cornwall heritage",
  ],
  authors: [{ name: "People of Cornwall" }],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "People of Cornwall — A Living Archive of Cornish Voices",
    description:
      "A community-driven storytelling platform preserving the voices, memories, and lived experiences of Cornwall.",
    type: "website",
    locale: "en_GB",
    siteName: "People of Cornwall",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "People of Cornwall - Stories, Events & Community",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "People of Cornwall — A Living Archive of Cornish Voices",
    description:
      "A community-driven storytelling platform preserving the voices, memories, and lived experiences of Cornwall.",
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={`${sourceSerif.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

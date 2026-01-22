import type { Metadata } from "next";
import { Source_Serif_4, Inter } from "next/font/google";
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
  openGraph: {
    title: "People of Cornwall — A Living Archive of Cornish Voices",
    description:
      "A community-driven storytelling platform preserving the voices, memories, and lived experiences of Cornwall.",
    type: "website",
    locale: "en_GB",
    siteName: "People of Cornwall",
  },
  twitter: {
    card: "summary_large_image",
    title: "People of Cornwall — A Living Archive of Cornish Voices",
    description:
      "A community-driven storytelling platform preserving the voices, memories, and lived experiences of Cornwall.",
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
    <html lang="en-GB" className={`${sourceSerif.variable} ${inter.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

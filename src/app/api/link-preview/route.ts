import { NextRequest, NextResponse } from "next/server";

/**
 * Fetches Open Graph metadata from a URL to create link previews
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PeopleOfCornwall/1.0; +https://peopleofcornwall.com)",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Could not fetch URL" },
        { status: 400 }
      );
    }

    const html = await response.text();

    // Extract metadata using regex (avoiding heavy dependencies)
    const getMetaContent = (property: string): string | null => {
      // Try og: tags first
      const ogMatch = html.match(
        new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']*)["']`, "i")
      ) || html.match(
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${property}["']`, "i")
      );
      if (ogMatch) return ogMatch[1];

      // Try twitter: tags
      const twitterMatch = html.match(
        new RegExp(`<meta[^>]*name=["']twitter:${property}["'][^>]*content=["']([^"']*)["']`, "i")
      ) || html.match(
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']twitter:${property}["']`, "i")
      );
      if (twitterMatch) return twitterMatch[1];

      // Try standard meta tags for description
      if (property === "description") {
        const metaMatch = html.match(
          /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i
        ) || html.match(
          /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i
        );
        if (metaMatch) return metaMatch[1];
      }

      return null;
    };

    // Extract title
    let title = getMetaContent("title");
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      title = titleMatch ? titleMatch[1].trim() : null;
    }

    // Extract other metadata
    const description = getMetaContent("description");
    let image = getMetaContent("image");
    const siteName = getMetaContent("site_name");

    // Make image URL absolute if relative
    if (image && !image.startsWith("http")) {
      image = new URL(image, url).href;
    }

    // Get favicon
    let favicon: string | null = null;
    const iconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i)
      || html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
    if (iconMatch) {
      favicon = iconMatch[1].startsWith("http") ? iconMatch[1] : new URL(iconMatch[1], url).href;
    } else {
      // Default to /favicon.ico
      favicon = `${parsedUrl.origin}/favicon.ico`;
    }

    return NextResponse.json({
      url,
      title: title || parsedUrl.hostname,
      description: description || null,
      image: image || null,
      siteName: siteName || parsedUrl.hostname,
      favicon,
    });
  } catch (error) {
    console.error("Link preview error:", error);
    return NextResponse.json(
      { error: "Failed to fetch link preview" },
      { status: 500 }
    );
  }
}

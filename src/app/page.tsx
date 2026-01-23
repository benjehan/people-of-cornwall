import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoryCard } from "@/components/story/story-card";
import { RotatingPrompts } from "@/components/home/rotating-prompts";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Folder, ArrowRight, Archive, Mail } from "lucide-react";
import { getFeaturedStory, getPublishedStories, getStoryDecades, getCollections, getRotatingPrompts, getFeaturedCollections } from "@/lib/supabase/queries";
import type { StoryWithDetails } from "@/types";

/**
 * Extract first image URL from story body HTML
 */
function extractImageFromBody(body: string | null): string | null {
  if (!body) return null;
  const imgMatch = body.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) return imgMatch[1];
  
  // Check for YouTube video thumbnail
  const youtubeMatch = body.match(/data-video-id="([a-zA-Z0-9_-]+)"[^>]*data-platform="youtube"/);
  const youtubeMatch2 = body.match(/data-platform="youtube"[^>]*data-video-id="([a-zA-Z0-9_-]+)"/);
  const youtubeId = youtubeMatch?.[1] || youtubeMatch2?.[1];
  if (youtubeId) return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  
  return null;
}

interface FeaturedCollection {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  story_count: number;
}

export default async function HomePage() {
  // Fetch real data from Supabase
  const [featuredStory, { stories: recentStories }, decades, collections, rotatingPrompts, featuredCollections] = await Promise.all([
    getFeaturedStory(),
    getPublishedStories({ perPage: 6 }),
    getStoryDecades(),
    getCollections(),
    getRotatingPrompts(), // Get ALL prompts for the carousel
    getFeaturedCollections(3),
  ]);

  // Convert to StoryWithDetails format
  const featured: StoryWithDetails | null = featuredStory
    ? {
        ...featuredStory,
        author: null,
        media: [],
        has_liked: false,
      }
    : null;

  const recent: StoryWithDetails[] = recentStories.map((story) => ({
    ...story,
    author: null,
    media: [],
    has_liked: false,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1">
        {/* Hero Section — Bold Editorial */}
        <section className="border-b border-bone py-16 md:py-24">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            {featured ? (
              <article className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                {/* Featured Image */}
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-granite">
                  {extractImageFromBody(featured.body) || featured.first_image_url ? (
                    <img
                      src={extractImageFromBody(featured.body) || featured.first_image_url || ""}
                      alt={featured.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-granite/80 to-slate/90">
                      <div className="text-center text-parchment/80">
                        <span className="text-6xl">📖</span>
                        <p className="mt-2 text-sm font-medium">Featured Story</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Featured Content */}
                <div className="flex flex-col justify-center">
                  <div className="mb-4">
                    <span className="text-xs font-medium uppercase tracking-widest text-copper">
                      Featured Story
                    </span>
                  </div>
                  <h1 className="mb-4 font-serif text-4xl font-bold leading-tight tracking-tight text-granite md:text-5xl">
                    {featured.title}
                  </h1>
                  {featured.ai_summary && (
                    <p className="mb-6 text-lg text-stone leading-relaxed">
                      {featured.ai_summary}
                    </p>
                  )}
                  <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-stone">
                    {!featured.anonymous && featured.author_display_name && (
                      <span>By {featured.author_display_name}</span>
                    )}
                    {featured.location_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {featured.location_name}
                      </span>
                    )}
                    {featured.timeline_decade && (
                      <span>{featured.timeline_decade}s</span>
                    )}
                  </div>
                  <Link href={`/stories/${featured.id}`}>
                    <Button className="w-fit gap-2 bg-granite text-parchment hover:bg-slate">
                      Read Story
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </article>
            ) : (
              <div className="text-center py-12">
                <h1 className="mb-6 font-serif text-5xl font-bold tracking-tight text-granite md:text-6xl">
                  A living archive of<br />Cornish voices
                </h1>
                <p className="mx-auto mb-8 max-w-xl text-lg text-stone">
                  Stories, memories, and experiences from the people of Cornwall.
                  Every voice matters. Every story is preserved.
                </p>
                <Link href="/write">
                  <Button className="gap-2 bg-granite text-parchment hover:bg-slate">
                    Share the first story
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Spark an Idea — Rotating Prompts (right after hero) */}
        {rotatingPrompts.length > 0 && (
          <RotatingPrompts prompts={rotatingPrompts} />
        )}

        {/* Recently Shared */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="font-serif text-3xl font-bold tracking-tight text-granite">
                  Recently Shared
                </h2>
                <p className="mt-2 text-stone">
                  The latest stories from our community
                </p>
              </div>
              <Link
                href="/stories"
                className="hidden items-center gap-1 text-sm font-medium text-granite hover:text-slate sm:flex"
              >
                View all stories
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {recent.length > 0 ? (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-bone bg-cream/50 py-16 text-center">
                <p className="mb-4 text-stone">
                  No stories have been shared yet
                </p>
                <Link href="/write">
                  <Button className="bg-granite text-parchment hover:bg-slate">
                    Be the first to share
                  </Button>
                </Link>
              </div>
            )}

            <div className="mt-8 text-center sm:hidden">
              <Link href="/stories">
                <Button variant="outline" className="border-granite text-granite">
                  View all stories
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Discovery Section — Three Ways to Explore */}
        <section className="border-t border-bone bg-cream py-16 md:py-20">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <div className="mb-12 text-center">
              <h2 className="font-serif text-3xl font-bold tracking-tight text-granite">
                Explore Stories
              </h2>
              <p className="mt-2 text-stone">
                Discover Cornwall through place, time, and theme
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* By Place */}
              <Link 
                href="/map"
                className="group rounded-lg border border-bone bg-parchment p-8 transition-all hover:border-granite hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bone group-hover:bg-granite group-hover:text-parchment transition-colors">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-serif text-xl font-bold text-granite">
                  By Place
                </h3>
                <p className="mb-4 text-sm text-stone">
                  Explore stories on an interactive map of Cornwall. Find tales from your town or discover new places.
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-granite group-hover:text-slate">
                  View Map
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>

              {/* By Time */}
              <Link 
                href="/timeline"
                className="group rounded-lg border border-bone bg-parchment p-8 transition-all hover:border-granite hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bone group-hover:bg-granite group-hover:text-parchment transition-colors">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-serif text-xl font-bold text-granite">
                  By Time
                </h3>
                <p className="mb-4 text-sm text-stone">
                  Travel through decades of Cornish history. From the 1920s to today, each era tells its own story.
                </p>
                {decades.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {decades.slice(0, 4).map((decade) => (
                      <span
                        key={decade}
                        className="rounded-full bg-bone px-2.5 py-0.5 text-xs text-slate"
                      >
                        {decade}s
                      </span>
                    ))}
                  </div>
                )}
                <span className="inline-flex items-center gap-1 text-sm font-medium text-granite group-hover:text-slate">
                  Browse Timeline
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>

              {/* By Collection */}
              <Link 
                href="/collections"
                className="group rounded-lg border border-bone bg-parchment p-8 transition-all hover:border-granite hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bone group-hover:bg-granite group-hover:text-parchment transition-colors">
                  <Folder className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-serif text-xl font-bold text-granite">
                  By Theme
                </h3>
                <p className="mb-4 text-sm text-stone">
                  Curated collections exploring specific themes: fishing, mining, festivals, and more.
                </p>
                {collections.length > 0 && (
                  <ul className="mb-4 space-y-1">
                    {collections.slice(0, 3).map((collection) => (
                      <li key={collection.id} className="text-sm text-stone">
                        {collection.title}
                        <span className="ml-1 text-silver">
                          ({collection.story_count})
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <span className="inline-flex items-center gap-1 text-sm font-medium text-granite group-hover:text-slate">
                  View Collections
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Collections */}
        {featuredCollections.length > 0 && (
          <section className="border-t border-bone py-16 md:py-20">
            <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
              <div className="mb-10 flex items-end justify-between">
                <div>
                  <h2 className="font-serif text-3xl font-bold tracking-tight text-granite md:text-4xl">
                    Collections
                  </h2>
                  <p className="mt-2 text-stone">
                    Curated stories exploring Cornwall's rich heritage
                  </p>
                </div>
                <Link
                  href="/collections"
                  className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-granite hover:text-slate transition-colors"
                >
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredCollections.map((collection: FeaturedCollection) => (
                  <Link
                    key={collection.id}
                    href={`/collections/${collection.slug}`}
                    className="group rounded-lg border border-bone bg-cream p-6 transition-all hover:border-granite hover:shadow-md"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-bone group-hover:bg-granite group-hover:text-parchment transition-colors">
                      <Folder className="h-4 w-4" />
                    </div>
                    <h3 className="mb-2 font-serif text-lg font-bold text-granite group-hover:text-slate">
                      {collection.title}
                    </h3>
                    {collection.description && (
                      <p className="mb-3 text-sm text-stone line-clamp-2">
                        {collection.description}
                      </p>
                    )}
                    <span className="text-xs text-silver">
                      {collection.story_count} {collection.story_count === 1 ? "story" : "stories"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Heritage Donations CTA */}
        <section className="border-t border-bone bg-cream py-16 md:py-20">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <div className="rounded-2xl border border-bone bg-parchment p-8 md:p-12">
              <div className="mx-auto max-w-3xl text-center">
                <div className="mb-6 inline-flex items-center justify-center rounded-full bg-copper/10 p-4">
                  <Archive className="h-8 w-8 text-copper" />
                </div>
                <h2 className="mb-4 font-serif text-2xl font-bold tracking-tight text-granite md:text-3xl">
                  Do you have a treasure trove of Cornish memories?
                </h2>
                <p className="mb-6 text-stone leading-relaxed md:text-lg">
                  If you hold precious <strong>stories, photograph collections, films, audio recordings, 
                  or historical documents</strong> that deserve to be preserved and shared with the community, 
                  we'd love to hear from you. Let's work together to build a special digital collection 
                  as part of our heritage museum.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href="mailto:hello@peopleofcornwall.com?subject=Heritage%20Collection%20Contribution"
                    className="inline-flex items-center gap-2 rounded-lg bg-granite px-6 py-3 font-medium text-parchment transition-colors hover:bg-slate"
                  >
                    <Mail className="h-5 w-5" />
                    Contact Us
                  </a>
                  <span className="text-sm text-stone">
                    hello@peopleofcornwall.com
                  </span>
                </div>
                <p className="mt-6 text-sm text-silver">
                  We'll help you digitise, organise, and share your collection with generations to come.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action — Full Width */}
        <section className="border-t border-bone bg-granite py-20 text-parchment dark:bg-bone dark:text-granite">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="mb-4 font-serif text-3xl font-bold tracking-tight md:text-4xl">
              Every story matters
            </h2>
            <p className="mb-8 text-lg text-silver dark:text-stone">
              Your memories are part of Cornwall's living history. Share a story
              from your family, your community, or your own experience.
            </p>
            <Link href="/write">
              <Button
                size="lg"
                className="bg-parchment text-granite hover:bg-cream font-medium dark:bg-granite dark:text-parchment dark:hover:bg-slate"
              >
                Share a Story
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

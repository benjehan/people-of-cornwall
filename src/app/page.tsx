import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoryCard } from "@/components/story/story-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Folder, Sparkles, ArrowRight } from "lucide-react";
import { getFeaturedStory, getPublishedStories, getStoryDecades, getCollections } from "@/lib/supabase/queries";
import type { StoryWithDetails } from "@/types";

export default async function HomePage() {
  // Fetch real data from Supabase
  const [featuredStory, { stories: recentStories }, decades, collections] = await Promise.all([
    getFeaturedStory(),
    getPublishedStories({ perPage: 4 }),
    getStoryDecades(),
    getCollections(),
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
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section — Featured Exhibition */}
        <section className="py-8 md:py-12">
          <div className="mx-auto max-w-[1400px] px-4">
            {featured ? (
              <StoryCard story={featured} featured />
            ) : (
              <Card className="overflow-hidden border-0 bg-gradient-to-br from-atlantic-blue to-atlantic-blue-dark text-chalk-white shadow-xl">
                <CardContent className="p-8 md:p-12 text-center">
                  <h2 className="mb-4 font-serif text-3xl font-semibold">
                    Welcome to People of Cornwall
                  </h2>
                  <p className="mb-6 text-lg text-chalk-white/90">
                    A living archive of Cornish voices. Share your stories,
                    memories, and experiences from Cornwall.
                  </p>
                  <Link href="/write">
                    <Button className="bg-copper-clay text-chalk-white hover:bg-copper-clay-light">
                      Share the first story
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Museum Rooms Grid */}
        <section className="py-8 md:py-12">
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Recently Shared — Main Column */}
              <div className="lg:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-serif text-2xl font-semibold">
                    Recently Shared
                  </h2>
                  <Link
                    href="/stories"
                    className="flex items-center gap-1 text-sm text-atlantic-blue hover:underline"
                  >
                    View all stories
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {recent.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {recent.map((story) => (
                      <StoryCard key={story.id} story={story} />
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed border-chalk-white-dark">
                    <CardContent className="py-12 text-center">
                      <p className="mb-4 text-muted-foreground">
                        No stories have been shared yet
                      </p>
                      <Link href="/write">
                        <Button className="bg-atlantic-blue text-chalk-white hover:bg-atlantic-blue-light">
                          Be the first to share
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar — Discovery Rooms */}
              <div className="space-y-6">
                {/* Stories by Place */}
                <Card className="border-chalk-white-dark bg-chalk-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 font-serif text-lg">
                      <MapPin className="h-5 w-5 text-atlantic-blue" />
                      Stories by Place
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Explore stories on an interactive map of Cornwall.
                    </p>
                    <Link href="/map">
                      <Button
                        variant="outline"
                        className="w-full border-atlantic-blue text-atlantic-blue hover:bg-atlantic-blue hover:text-chalk-white"
                      >
                        View Map
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Stories by Time */}
                <Card className="border-chalk-white-dark bg-chalk-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 font-serif text-lg">
                      <Clock className="h-5 w-5 text-atlantic-blue" />
                      Stories by Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Browse stories across the decades.
                    </p>
                    {/* Decade quick links */}
                    {decades.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {decades.slice(0, 6).map((decade) => (
                          <Link
                            key={decade}
                            href={`/stories?decade=${decade}`}
                            className="rounded-full bg-chalk-white-dark px-3 py-1 text-xs text-slate-grey transition-colors hover:bg-sea-foam-light"
                          >
                            {decade}s
                          </Link>
                        ))}
                      </div>
                    )}
                    <Link href="/timeline">
                      <Button
                        variant="outline"
                        className="w-full border-atlantic-blue text-atlantic-blue hover:bg-atlantic-blue hover:text-chalk-white"
                      >
                        Browse Timeline
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Collections */}
                <Card className="border-chalk-white-dark bg-chalk-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 font-serif text-lg">
                      <Folder className="h-5 w-5 text-atlantic-blue" />
                      Collections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {collections.length > 0 ? (
                      <ul className="space-y-2">
                        {collections.slice(0, 4).map((collection) => (
                          <li key={collection.id}>
                            <Link
                              href={`/collections/${collection.slug}`}
                              className="text-sm text-atlantic-blue hover:underline"
                            >
                              {collection.title}
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({collection.story_count})
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Collections coming soon...
                      </p>
                    )}
                    {collections.length > 4 && (
                      <Link href="/collections" className="mt-4 block">
                        <Button variant="ghost" className="w-full text-atlantic-blue">
                          All Collections
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>

                {/* Community Prompt */}
                <Card className="border-copper-clay/30 bg-gradient-to-br from-copper-clay/5 to-copper-clay/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 font-serif text-lg">
                      <Sparkles className="h-5 w-5 text-copper-clay" />
                      Community Prompt
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 font-serif text-base italic text-slate-grey">
                      "What was market day like in your town?"
                    </p>
                    <Link href="/write?prompt=market-day">
                      <Button className="w-full bg-copper-clay text-chalk-white hover:bg-copper-clay-light">
                        Share Your Story
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="border-t border-chalk-white-dark bg-chalk-white-dark/30 py-16">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="mb-4 font-serif text-3xl font-semibold">
              Every story matters
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Your memories are part of Cornwall's living history. Share a story
              from your family, your community, or your own experience.
            </p>
            <Link href="/write">
              <Button
                size="lg"
                className="bg-atlantic-blue text-chalk-white hover:bg-atlantic-blue-light"
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

import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoryCard } from "@/components/story/story-card";
import { Button } from "@/components/ui/button";
import { LocationFilter } from "@/components/timeline/location-filter";
import { ChevronRight } from "lucide-react";
import { getPublishedStories, getStoryDecades, getStoryLocations, StoryWithCounts } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";
import type { StoryWithDetails } from "@/types";

interface PageProps {
  searchParams: Promise<{
    decade?: string;
    location?: string;
  }>;
}

export const metadata = {
  title: "Timeline | People of Cornwall",
  description: "Browse Cornwall stories across the decades.",
};

export default async function TimelinePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedDecade = params.decade ? parseInt(params.decade) : null;
  const selectedLocation = params.location || null;

  const [decades, locations, { stories }] = await Promise.all([
    getStoryDecades(),
    getStoryLocations(),
    getPublishedStories({
      decade: selectedDecade || undefined,
      location: selectedLocation || undefined,
      perPage: 100,
    }),
  ]);

  // Group stories by decade
  const storiesByDecade = stories.reduce((acc: Record<number, StoryWithCounts[]>, story) => {
    const decade = story.timeline_decade || 0;
    if (!acc[decade]) {
      acc[decade] = [];
    }
    acc[decade].push(story);
    return acc;
  }, {} as Record<number, StoryWithCounts[]>);

  // Convert to StoryWithDetails
  const convertStory = (story: StoryWithCounts): StoryWithDetails => ({
    ...story,
    author: null,
    media: [],
    has_liked: false,
  });

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-bone py-12 md:py-16">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight text-granite md:text-5xl">
              Timeline
            </h1>
            <p className="max-w-2xl text-lg text-stone">
              Travel through Cornwall's history, decade by decade. Each story is
              a window into a different era of Cornish life.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="sticky top-16 z-40 border-b border-bone bg-cream/95 backdrop-blur">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 py-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Decade filters */}
              <div className="flex flex-wrap items-center gap-2">
                <Link href={selectedLocation ? `/timeline?location=${encodeURIComponent(selectedLocation)}` : "/timeline"}>
                  <button
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                      selectedDecade === null 
                        ? "bg-granite text-parchment"
                        : "text-stone hover:text-granite"
                    )}
                  >
                    All
                  </button>
                </Link>
                {decades.map((decade) => (
                  <Link 
                    key={decade} 
                    href={`/timeline?decade=${decade}${selectedLocation ? `&location=${encodeURIComponent(selectedLocation)}` : ""}`}
                  >
                    <button
                      className={cn(
                        "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                        selectedDecade === decade 
                          ? "bg-granite text-parchment"
                          : "text-stone hover:text-granite"
                      )}
                    >
                      {decade}s
                    </button>
                  </Link>
                ))}
              </div>

              {/* Location filter - Client Component */}
              <LocationFilter 
                locations={locations}
                selectedLocation={selectedLocation}
                selectedDecade={selectedDecade}
              />
            </div>

            {/* Active filters */}
            {(selectedDecade || selectedLocation) && (
              <div className="mt-3 flex items-center gap-2 text-sm text-stone">
                <span>Showing:</span>
                {selectedDecade && (
                  <span className="rounded-full bg-granite/10 px-2.5 py-0.5 text-granite">
                    {selectedDecade}s
                  </span>
                )}
                {selectedLocation && (
                  <span className="rounded-full bg-granite/10 px-2.5 py-0.5 text-granite">
                    {selectedLocation}
                  </span>
                )}
                <span className="text-silver">
                  ({stories.length} {stories.length === 1 ? "story" : "stories"})
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Timeline Content */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            {selectedDecade ? (
              // Single decade view
              <div>
                <h2 className="mb-8 font-serif text-3xl font-bold text-granite">
                  The {selectedDecade}s
                  <span className="ml-3 text-lg font-normal text-stone">
                    {storiesByDecade[selectedDecade]?.length || 0} stories
                  </span>
                </h2>

                {storiesByDecade[selectedDecade]?.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {storiesByDecade[selectedDecade].map((story) => (
                      <StoryCard key={story.id} story={convertStory(story)} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-bone py-20 text-center">
                    <p className="mb-4 text-stone">
                      No stories from the {selectedDecade}s yet
                    </p>
                    <Link href="/write">
                      <Button className="bg-granite text-parchment hover:bg-slate">
                        Share a story from this era
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              // All decades view
              <div className="space-y-16">
                {decades.length > 0 ? (
                  [...decades].reverse().map((decade) => {
                    const decadeStories = storiesByDecade[decade] || [];
                    if (decadeStories.length === 0) return null;

                    return (
                      <div key={decade} className="relative">
                        {/* Timeline line */}
                        <div className="absolute -left-4 top-0 hidden h-full w-0.5 bg-bone md:block">
                          <div className="absolute -left-1.5 top-3 h-4 w-4 rounded-full border-2 border-granite bg-parchment" />
                        </div>

                        <div className="md:ml-8">
                          <div className="mb-6 flex items-center justify-between">
                            <h2 className="font-serif text-2xl font-bold text-granite">
                              {decade}s
                              <span className="ml-2 text-base font-normal text-stone">
                                ({decadeStories.length})
                              </span>
                            </h2>
                            <Link
                              href={`/timeline?decade=${decade}`}
                              className="flex items-center gap-1 text-sm font-medium text-granite hover:text-slate transition-colors"
                            >
                              View all
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </div>

                          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {decadeStories.slice(0, 3).map((story) => (
                              <StoryCard
                                key={story.id}
                                story={convertStory(story)}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed border-bone py-20 text-center">
                    <p className="mb-4 text-stone">
                      No stories have been shared yet
                    </p>
                    <Link href="/write">
                      <Button className="bg-granite text-parchment hover:bg-slate">
                        Be the first to share a story
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Undated Stories */}
                {storiesByDecade[0]?.length > 0 && (
                  <div className="border-t border-bone pt-12">
                    <h2 className="mb-6 font-serif text-xl font-bold text-stone">
                      Timeless Stories
                      <span className="ml-2 text-base font-normal">
                        ({storiesByDecade[0].length})
                      </span>
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {storiesByDecade[0].slice(0, 3).map((story) => (
                        <StoryCard
                          key={story.id}
                          story={convertStory(story)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

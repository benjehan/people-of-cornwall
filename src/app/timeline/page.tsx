import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoryCard } from "@/components/story/story-card";
import { Button } from "@/components/ui/button";
import { MapPin, X } from "lucide-react";
import { getPublishedStories, getStoryDecades, getStoryLocations } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";
import type { StoryWithDetails } from "@/types";

interface PageProps {
  searchParams: Promise<{
    decade?: string;
    location?: string;
  }>;
}

export const metadata = {
  title: "Stories by Time",
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
  const storiesByDecade = stories.reduce((acc, story) => {
    const decade = story.timeline_decade || 0;
    if (!acc[decade]) {
      acc[decade] = [];
    }
    acc[decade].push(story);
    return acc;
  }, {} as Record<number, typeof stories>);

  // Convert to StoryWithDetails
  const convertStory = (story: typeof stories[0]): StoryWithDetails => ({
    ...story,
    author: null,
    media: [],
    has_liked: false,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-chalk-white-dark bg-gradient-to-b from-chalk-white to-chalk-white-dark/30 py-12">
          <div className="mx-auto max-w-[1400px] px-4">
            <h1 className="mb-4 font-serif text-4xl font-semibold">
              Stories by Time
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Travel through Cornwall's history, decade by decade. Each story is
              a window into a different era of Cornish life.
            </p>
          </div>
        </section>

        {/* Timeline Navigation */}
        <section className="sticky top-16 z-40 border-b border-chalk-white-dark bg-chalk-white/95 backdrop-blur">
          <div className="mx-auto max-w-[1400px] px-4 py-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Decade filters */}
              <div className="flex flex-wrap items-center gap-2">
                <Link href={selectedLocation ? `/timeline?location=${encodeURIComponent(selectedLocation)}` : "/timeline"}>
                  <Button
                    variant={selectedDecade === null ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      selectedDecade === null &&
                        "bg-atlantic-blue text-chalk-white"
                    )}
                  >
                    All Decades
                  </Button>
                </Link>
                {decades.map((decade) => (
                  <Link 
                    key={decade} 
                    href={`/timeline?decade=${decade}${selectedLocation ? `&location=${encodeURIComponent(selectedLocation)}` : ""}`}
                  >
                    <Button
                      variant={selectedDecade === decade ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        selectedDecade === decade &&
                          "bg-atlantic-blue text-chalk-white"
                      )}
                    >
                      {decade}s
                    </Button>
                  </Link>
                ))}
              </div>

              {/* Location filter */}
              <div className="flex items-center gap-2 border-l border-chalk-white-dark pl-4">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <select
                  defaultValue={selectedLocation || ""}
                  onChange={(e) => {
                    const loc = e.target.value;
                    const url = new URL(window.location.href);
                    if (loc) {
                      url.searchParams.set("location", loc);
                    } else {
                      url.searchParams.delete("location");
                    }
                    window.location.href = url.toString();
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="">All locations</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                {selectedLocation && (
                  <Link 
                    href={selectedDecade ? `/timeline?decade=${selectedDecade}` : "/timeline"}
                    className="text-muted-foreground hover:text-foreground"
                    title="Clear location filter"
                  >
                    <X className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>

            {/* Active filters display */}
            {(selectedDecade || selectedLocation) && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <span>Showing:</span>
                {selectedDecade && (
                  <span className="rounded-full bg-atlantic-blue/10 px-2 py-0.5 text-atlantic-blue">
                    {selectedDecade}s
                  </span>
                )}
                {selectedLocation && (
                  <span className="rounded-full bg-copper-clay/10 px-2 py-0.5 text-copper-clay">
                    {selectedLocation}
                  </span>
                )}
                <span>({stories.length} {stories.length === 1 ? "story" : "stories"})</span>
              </div>
            )}
          </div>
        </section>

        {/* Timeline Content */}
        <section className="py-8">
          <div className="mx-auto max-w-[1400px] px-4">
            {selectedDecade ? (
              // Single decade view
              <div>
                <h2 className="mb-6 font-serif text-2xl font-semibold">
                  {selectedDecade}s
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    ({storiesByDecade[selectedDecade]?.length || 0} stories)
                  </span>
                </h2>

                {storiesByDecade[selectedDecade]?.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {storiesByDecade[selectedDecade].map((story) => (
                      <StoryCard key={story.id} story={convertStory(story)} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-chalk-white-dark py-16 text-center">
                    <p className="mb-4 text-muted-foreground">
                      No stories from the {selectedDecade}s yet
                    </p>
                    <Link href="/write">
                      <Button className="bg-copper-clay text-chalk-white hover:bg-copper-clay-light">
                        Share a story from this era
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              // All decades view
              <div className="space-y-12">
                {decades.length > 0 ? (
                  [...decades].reverse().map((decade) => {
                    const decadeStories = storiesByDecade[decade] || [];
                    if (decadeStories.length === 0) return null;

                    return (
                      <div key={decade} className="relative">
                        {/* Timeline marker */}
                        <div className="absolute -left-4 top-0 hidden h-full w-px bg-atlantic-blue/20 md:block">
                          <div className="absolute -left-2 top-2 h-5 w-5 rounded-full border-4 border-atlantic-blue bg-chalk-white" />
                        </div>

                        <div className="md:ml-8">
                          <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-serif text-2xl font-semibold">
                              {decade}s
                              <span className="ml-2 text-base font-normal text-muted-foreground">
                                ({decadeStories.length}{" "}
                                {decadeStories.length === 1
                                  ? "story"
                                  : "stories"}
                                )
                              </span>
                            </h2>
                            <Link
                              href={`/timeline?decade=${decade}`}
                              className="text-sm text-atlantic-blue hover:underline"
                            >
                              View all →
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
                  <div className="rounded-lg border border-dashed border-chalk-white-dark py-16 text-center">
                    <p className="mb-4 text-muted-foreground">
                      No stories have been shared yet
                    </p>
                    <Link href="/write">
                      <Button className="bg-copper-clay text-chalk-white hover:bg-copper-clay-light">
                        Be the first to share a story
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Stories without decade */}
                {storiesByDecade[0]?.length > 0 && (
                  <div className="border-t border-chalk-white-dark pt-8">
                    <h2 className="mb-4 font-serif text-xl font-semibold text-muted-foreground">
                      Undated Stories
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

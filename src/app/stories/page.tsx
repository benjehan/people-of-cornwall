import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoryCard } from "@/components/story/story-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { getPublishedStories, getStoryDecades, getStoryLocations } from "@/lib/supabase/queries";
import type { StoryWithDetails } from "@/types";

// Install select component
// We need to add it, but for now let's create a simpler version

interface PageProps {
  searchParams: Promise<{
    page?: string;
    decade?: string;
    location?: string;
    tag?: string;
    search?: string;
  }>;
}

export default async function StoriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const decade = params.decade ? parseInt(params.decade) : undefined;
  const location = params.location;
  const tag = params.tag;
  const search = params.search;

  const [{ stories, count }, decades, locations] = await Promise.all([
    getPublishedStories({ page, decade, location, tag, search, perPage: 12 }),
    getStoryDecades(),
    getStoryLocations(),
  ]);

  const totalPages = Math.ceil(count / 12);

  // Convert to StoryWithDetails format
  const storiesWithDetails: StoryWithDetails[] = stories.map((story) => ({
    ...story,
    author: null,
    media: [],
    has_liked: false,
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-chalk-white-dark bg-gradient-to-b from-chalk-white to-chalk-white-dark/30 py-12">
          <div className="mx-auto max-w-[1400px] px-4">
            <h1 className="mb-4 font-serif text-4xl font-semibold">Stories</h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Explore stories from across Cornwall, shared by our community.
              Each story is a window into the lives and memories of Cornish people.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b border-chalk-white-dark py-4">
          <div className="mx-auto max-w-[1400px] px-4">
            <form className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search stories..."
                  defaultValue={search}
                  className="pl-9"
                />
              </div>

              {/* Decade filter */}
              <select
                name="decade"
                defaultValue={decade?.toString() || ""}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All decades</option>
                {decades.map((d) => (
                  <option key={d} value={d}>
                    {d}s
                  </option>
                ))}
              </select>

              {/* Location filter */}
              <select
                name="location"
                defaultValue={location || ""}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All places</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>

              <Button type="submit" variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filter
              </Button>

              {(search || decade || location || tag) && (
                <Link href="/stories">
                  <Button variant="ghost" className="text-muted-foreground">
                    Clear filters
                  </Button>
                </Link>
              )}
            </form>

            {/* Active filters */}
            {tag && (
              <div className="mt-3">
                <span className="text-sm text-muted-foreground">
                  Showing stories tagged:{" "}
                  <span className="font-medium text-foreground">{tag}</span>
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Stories Grid */}
        <section className="py-8">
          <div className="mx-auto max-w-[1400px] px-4">
            {storiesWithDetails.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  Showing {stories.length} of {count} stories
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {storiesWithDetails.map((story) => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    {page > 1 && (
                      <Link
                        href={`/stories?page=${page - 1}${decade ? `&decade=${decade}` : ""}${location ? `&location=${location}` : ""}${search ? `&search=${search}` : ""}`}
                      >
                        <Button variant="outline">Previous</Button>
                      </Link>
                    )}

                    <span className="px-4 text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>

                    {page < totalPages && (
                      <Link
                        href={`/stories?page=${page + 1}${decade ? `&decade=${decade}` : ""}${location ? `&location=${location}` : ""}${search ? `&search=${search}` : ""}`}
                      >
                        <Button variant="outline">Next</Button>
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center">
                <p className="mb-4 text-xl text-muted-foreground">
                  No stories found
                </p>
                <p className="mb-8 text-muted-foreground">
                  {search || decade || location
                    ? "Try adjusting your filters"
                    : "Be the first to share a story from Cornwall"}
                </p>
                <Link href="/write">
                  <Button className="bg-copper-clay text-chalk-white hover:bg-copper-clay-light">
                    Share a story
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

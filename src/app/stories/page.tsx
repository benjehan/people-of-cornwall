import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoryCard } from "@/components/story/story-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { getPublishedStories, getStoryDecades, getStoryLocations } from "@/lib/supabase/queries";
import type { StoryWithDetails } from "@/types";

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
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-bone py-12 md:py-16">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight text-granite md:text-5xl">
              Stories
            </h1>
            <p className="max-w-2xl text-lg text-stone">
              Explore stories from across Cornwall, shared by our community.
              Each story is a window into the lives and memories of Cornish people.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b border-bone bg-cream py-5">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <form className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
                <Input
                  name="search"
                  placeholder="Search stories..."
                  defaultValue={search}
                  className="pl-9 bg-parchment border-bone focus:border-granite"
                />
              </div>

              {/* Decade filter */}
              <select
                name="decade"
                defaultValue={decade?.toString() || ""}
                className="h-10 rounded-md border border-bone bg-parchment px-3 text-sm text-granite focus:border-granite focus:outline-none"
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
                className="h-10 rounded-md border border-bone bg-parchment px-3 text-sm text-granite focus:border-granite focus:outline-none"
              >
                <option value="">All places</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>

              <Button type="submit" className="bg-granite text-parchment hover:bg-slate">
                Apply
              </Button>

              {(search || decade || location || tag) && (
                <Link href="/stories">
                  <Button variant="ghost" className="gap-1 text-stone hover:text-granite">
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                </Link>
              )}
            </form>

            {/* Active filters */}
            {tag && (
              <div className="mt-3">
                <span className="text-sm text-stone">
                  Showing stories tagged:{" "}
                  <span className="font-medium text-granite">{tag}</span>
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Stories Grid */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            {storiesWithDetails.length > 0 ? (
              <>
                <div className="mb-8 text-sm text-stone">
                  Showing {stories.length} of {count} stories
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {storiesWithDetails.map((story) => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    {page > 1 && (
                      <Link
                        href={`/stories?page=${page - 1}${decade ? `&decade=${decade}` : ""}${location ? `&location=${location}` : ""}${search ? `&search=${search}` : ""}`}
                      >
                        <Button variant="outline" className="border-granite text-granite hover:bg-granite hover:text-parchment">
                          Previous
                        </Button>
                      </Link>
                    )}

                    <span className="px-4 text-sm text-stone">
                      Page {page} of {totalPages}
                    </span>

                    {page < totalPages && (
                      <Link
                        href={`/stories?page=${page + 1}${decade ? `&decade=${decade}` : ""}${location ? `&location=${location}` : ""}${search ? `&search=${search}` : ""}`}
                      >
                        <Button variant="outline" className="border-granite text-granite hover:bg-granite hover:text-parchment">
                          Next
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center">
                <h2 className="mb-4 font-serif text-2xl font-bold text-granite">
                  No stories found
                </h2>
                <p className="mb-8 text-stone">
                  {search || decade || location
                    ? "Try adjusting your filters"
                    : "Be the first to share a story from Cornwall"}
                </p>
                <Link href="/write">
                  <Button className="bg-granite text-parchment hover:bg-slate">
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

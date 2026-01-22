import { Suspense } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoryCard } from "@/components/story/story-card";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft } from "lucide-react";
import { getPublishedStories, StoryWithCounts } from "@/lib/supabase/queries";
import { SearchInput } from "@/components/search/search-input";
import type { StoryWithDetails } from "@/types";

interface PageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export const metadata = {
  title: "Search | People of Cornwall",
  description: "Search through Cornwall's stories and memories.",
};

async function SearchResults({ query }: { query: string }) {
  if (!query || query.length < 2) {
    return (
      <div className="text-center py-16">
        <Search className="mx-auto h-12 w-12 text-stone/30 mb-4" />
        <p className="text-stone">Enter at least 2 characters to search</p>
      </div>
    );
  }

  const { stories } = await getPublishedStories({ search: query, perPage: 50 });

  const convertStory = (story: StoryWithCounts): StoryWithDetails => ({
    ...story,
    author: null,
    media: [],
    has_liked: false,
  });

  if (stories.length === 0) {
    return (
      <div className="text-center py-16">
        <Search className="mx-auto h-12 w-12 text-stone/30 mb-4" />
        <h3 className="font-serif text-xl font-bold text-granite mb-2">No stories found</h3>
        <p className="text-stone mb-6">
          We couldn't find any stories matching "{query}"
        </p>
        <Link href="/write">
          <Button className="bg-granite text-parchment hover:bg-slate">
            Share a story about this
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-6 text-stone">
        Found {stories.length} {stories.length === 1 ? "story" : "stories"} matching "{query}"
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((story) => (
          <StoryCard key={story.id} story={convertStory(story)} />
        ))}
      </div>
    </div>
  );
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q || "";

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1 py-12 md:py-16">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          {/* Back link */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1 text-sm text-stone hover:text-granite transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="mb-10">
            <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight text-granite md:text-5xl">
              Search Stories
            </h1>
            <p className="max-w-2xl text-lg text-stone mb-6">
              Find stories by title, content, location, or theme.
            </p>
            
            {/* Search Input */}
            <SearchInput initialQuery={query} />
          </div>

          {/* Results */}
          <Suspense fallback={
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-granite border-t-transparent" />
            </div>
          }>
            <SearchResults query={query} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}

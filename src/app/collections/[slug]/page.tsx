import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoryCard } from "@/components/story/story-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Folder } from "lucide-react";
import { getCollectionStories } from "@/lib/supabase/queries";
import type { StoryWithDetails } from "@/types";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { collection } = await getCollectionStories(slug);

  if (!collection) {
    return { title: "Collection Not Found" };
  }

  return {
    title: `${collection.title} | Collections | People of Cornwall`,
    description: collection.description || `Stories in the ${collection.title} collection.`,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { collection, stories } = await getCollectionStories(slug);

  if (!collection) {
    notFound();
  }

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
        {/* Back link */}
        <div className="mx-auto max-w-[1400px] px-4 pt-8">
          <Link
            href="/collections"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to collections
          </Link>
        </div>

        {/* Collection Header */}
        <section className="border-b border-chalk-white-dark py-12">
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="flex items-center gap-3 mb-4">
              <Folder className="h-8 w-8 text-atlantic-blue" />
              <h1 className="font-serif text-4xl font-semibold">{collection.title}</h1>
            </div>
            {collection.description && (
              <p className="max-w-2xl text-lg text-muted-foreground">
                {collection.description}
              </p>
            )}
            <p className="mt-4 text-sm text-muted-foreground">
              {stories.length} {stories.length === 1 ? "story" : "stories"} in this collection
            </p>
          </div>
        </section>

        {/* Stories Grid */}
        <section className="py-12">
          <div className="mx-auto max-w-[1400px] px-4">
            {storiesWithDetails.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {storiesWithDetails.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="mb-4 text-xl text-muted-foreground">
                  No stories in this collection yet
                </p>
                <p className="mb-8 text-muted-foreground">
                  Check back soon for curated stories.
                </p>
                <Link href="/stories">
                  <Button className="bg-atlantic-blue text-chalk-white hover:bg-atlantic-blue-light">
                    Browse all stories
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

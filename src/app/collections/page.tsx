import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ArrowRight, Folder } from "lucide-react";
import { getCollections } from "@/lib/supabase/queries";

export const metadata = {
  title: "Collections | People of Cornwall",
  description: "Browse curated collections of Cornish stories by theme.",
};

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-bone py-12 md:py-16">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight text-granite md:text-5xl">
              Collections
            </h1>
            <p className="max-w-2xl text-lg text-stone">
              Curated collections of stories, grouped by theme, place, or moment in time.
              Each collection is a window into a different aspect of Cornish life.
            </p>
          </div>
        </section>

        {/* Collections Grid */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            {collections.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {collections.map((collection) => (
                  <Link 
                    key={collection.id} 
                    href={`/collections/${collection.slug}`}
                    className="group"
                  >
                    <article className="h-full rounded-lg border border-transparent bg-cream p-8 transition-all hover:border-bone hover:shadow-md">
                      <div className="mb-4 flex items-start justify-between">
                        <h2 className="font-serif text-xl font-bold text-granite group-hover:text-copper transition-colors">
                          {collection.title}
                        </h2>
                        <ArrowRight className="h-5 w-5 text-silver transition-transform group-hover:translate-x-1 group-hover:text-copper" />
                      </div>
                      <p className="mb-4 text-sm text-stone line-clamp-3">
                        {collection.description || "Explore stories in this collection."}
                      </p>
                      <p className="text-xs uppercase tracking-widest text-silver">
                        {collection.story_count} {collection.story_count === 1 ? "story" : "stories"}
                      </p>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cream">
                  <Folder className="h-10 w-10 text-stone" />
                </div>
                <h2 className="mb-3 font-serif text-2xl font-bold text-granite">
                  Collections coming soon
                </h2>
                <p className="text-stone">
                  Our curators are working on thematic collections of Cornish stories.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

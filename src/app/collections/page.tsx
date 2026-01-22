import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Folder, ArrowRight } from "lucide-react";
import { getCollections } from "@/lib/supabase/queries";

export const metadata = {
  title: "Collections | People of Cornwall",
  description: "Browse curated collections of Cornish stories by theme.",
};

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-chalk-white-dark bg-gradient-to-b from-chalk-white to-chalk-white-dark/30 py-12">
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="flex items-center gap-3 mb-4">
              <Folder className="h-8 w-8 text-atlantic-blue" />
              <h1 className="font-serif text-4xl font-semibold">Collections</h1>
            </div>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Curated collections of stories, grouped by theme, place, or moment in time.
              Each collection is a window into a different aspect of Cornish life.
            </p>
          </div>
        </section>

        {/* Collections Grid */}
        <section className="py-12">
          <div className="mx-auto max-w-[1400px] px-4">
            {collections.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {collections.map((collection) => (
                  <Link key={collection.id} href={`/collections/${collection.slug}`}>
                    <Card className="group h-full cursor-pointer border-chalk-white-dark bg-chalk-white transition-all hover:border-atlantic-blue hover:shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between font-serif text-xl">
                          {collection.title}
                          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-atlantic-blue" />
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {collection.story_count} {collection.story_count === 1 ? "story" : "stories"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground line-clamp-3">
                          {collection.description || "Explore stories in this collection."}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <Folder className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
                <h2 className="mb-2 font-serif text-2xl font-semibold">
                  Collections coming soon
                </h2>
                <p className="text-muted-foreground">
                  Our curators are working on thematic collections of Cornish stories.
                  Check back soon!
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

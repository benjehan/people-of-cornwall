import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoryMap } from "@/components/map/story-map";
import { getPublishedStories } from "@/lib/supabase/queries";

export const metadata = {
  title: "Stories by Place",
  description: "Explore stories from across Cornwall on an interactive map.",
};

export default async function MapPage() {
  // Get all stories with locations
  const { stories } = await getPublishedStories({ perPage: 100 });
  
  // Filter to only stories with coordinates
  const storiesWithLocation = stories.filter(
    (s) => s.location_lat && s.location_lng
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 flex-col">
        {/* Header */}
        <section className="border-b border-chalk-white-dark bg-gradient-to-b from-chalk-white to-chalk-white-dark/30 py-8">
          <div className="mx-auto max-w-[1400px] px-4">
            <h1 className="mb-2 font-serif text-3xl font-semibold">
              Stories by Place
            </h1>
            <p className="text-muted-foreground">
              Explore {storiesWithLocation.length} stories from across Cornwall.
              Click a marker to read the story.
            </p>
          </div>
        </section>

        {/* Map */}
        <section className="flex-1">
          <StoryMap stories={storiesWithLocation} />
        </section>
      </main>

      <Footer />
    </div>
  );
}

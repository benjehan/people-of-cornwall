import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoryMap } from "@/components/map/story-map";
import { getPublishedStories } from "@/lib/supabase/queries";

export const metadata = {
  title: "Map | People of Cornwall",
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
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex flex-1 flex-col">
        {/* Header */}
        <section className="border-b border-bone py-10">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <h1 className="mb-2 font-serif text-3xl font-bold tracking-tight text-granite">
              Stories by Place
            </h1>
            <p className="text-stone">
              {storiesWithLocation.length > 0 
                ? `Explore ${storiesWithLocation.length} stories from across Cornwall. Click a marker to read the story.`
                : "No stories with locations yet. Be the first to share a story from a place in Cornwall!"
              }
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

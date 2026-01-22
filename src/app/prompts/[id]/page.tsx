import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoryCard } from "@/components/story/story-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PenLine, Sparkles } from "lucide-react";
import { getPromptStories } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { StoryWithDetails } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: prompt } = await (supabase
    .from("prompts") as any)
    .select("title")
    .eq("id", id)
    .single();
  
  return {
    title: prompt ? `${prompt.title} | People of Cornwall` : "Prompt | People of Cornwall",
  };
}

export default async function PromptPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Get prompt details
  const { data: prompt, error } = await (supabase
    .from("prompts") as any)
    .select("*")
    .eq("id", id)
    .single();

  if (error || !prompt) {
    notFound();
  }

  // Get stories for this prompt
  const stories = await getPromptStories(id);

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
            <Link
              href="/prompts"
              className="mb-6 inline-flex items-center gap-1 text-sm text-stone hover:text-granite transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              All prompts
            </Link>

            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-copper" />
              <span className="text-sm font-medium text-copper">Community Prompt</span>
            </div>

            <h1 className="mb-4 font-serif text-3xl font-bold tracking-tight text-granite md:text-4xl">
              "{prompt.title}"
            </h1>

            {prompt.description && (
              <p className="mb-8 max-w-2xl text-lg text-stone">
                {prompt.description}
              </p>
            )}

            <Link href={`/write?prompt=${prompt.id}`}>
              <Button className="gap-2 bg-granite text-parchment hover:bg-slate font-medium">
                <PenLine className="h-4 w-4" />
                Write your story
              </Button>
            </Link>
          </div>
        </section>

        {/* Stories */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <h2 className="mb-8 font-serif text-2xl font-bold text-granite">
              Stories
              <span className="ml-2 text-base font-normal text-stone">
                ({storiesWithDetails.length})
              </span>
            </h2>

            {storiesWithDetails.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {storiesWithDetails.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-bone py-16 text-center">
                <p className="mb-4 text-stone">
                  No stories have been written for this prompt yet.
                </p>
                <Link href={`/write?prompt=${prompt.id}`}>
                  <Button className="bg-granite text-parchment hover:bg-slate">
                    Be the first to share
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

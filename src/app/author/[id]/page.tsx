import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoryCard } from "@/components/story/story-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MapPin, Calendar, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { StoryWithDetails } from "@/types";

interface Author {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface Story {
  id: string;
  title: string;
  body: string | null;
  status: string;
  published_at: string | null;
  location_name: string | null;
  timeline_decade: number | null;
  author_display_name: string | null;
  anonymous: boolean;
  ai_tags: string[] | null;
  ai_summary: string | null;
  likes_count: number;
  comments_count: number;
}

async function getAuthorProfile(id: string): Promise<Author | null> {
  const supabase = await createClient();
  const { data } = await (supabase
    .from("users") as any)
    .select("id, display_name, avatar_url, bio, created_at")
    .eq("id", id)
    .single();
  return data;
}

async function getAuthorStories(authorId: string): Promise<Story[]> {
  const supabase = await createClient();
  const { data } = await (supabase
    .from("stories") as any)
    .select("*, likes(count), comments(count)")
    .eq("author_id", authorId)
    .eq("status", "published")
    .eq("soft_deleted", false)
    .eq("anonymous", false) // Only show non-anonymous stories on profile
    .order("published_at", { ascending: false });

  return (data || []).map((story: any) => ({
    ...story,
    likes_count: Array.isArray(story.likes) ? story.likes[0]?.count || 0 : 0,
    comments_count: Array.isArray(story.comments) ? story.comments[0]?.count || 0 : 0,
  }));
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  const author = await getAuthorProfile(id);
  
  if (!author) {
    return { title: "Author Not Found" };
  }

  const name = author.display_name || "Contributor";
  return {
    title: `${name} | People of Cornwall`,
    description: author.bio || `Stories shared by ${name} on People of Cornwall.`,
    openGraph: {
      title: `${name} | People of Cornwall`,
      description: author.bio || `Stories shared by ${name} on People of Cornwall.`,
      type: "profile",
      images: author.avatar_url ? [{ url: author.avatar_url }] : undefined,
    },
  };
}

export default async function AuthorPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const [author, stories] = await Promise.all([
    getAuthorProfile(id),
    getAuthorStories(id),
  ]);

  if (!author) {
    notFound();
  }

  const memberSince = new Date(author.created_at).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const convertStory = (story: Story) => ({
    ...story,
    author: null,
    media: [],
    has_liked: false,
    timeline_year: null,
    location_lat: null,
    location_lng: null,
    rejection_reason: null,
    created_at: "",
    updated_at: "",
    soft_deleted: false,
    featured: false,
    author_id: "",
  }) as StoryWithDetails;

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1 py-12 md:py-16">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          {/* Back link */}
          <Link
            href="/stories"
            className="mb-8 inline-flex items-center gap-1 text-sm text-stone hover:text-granite transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to stories
          </Link>

          {/* Author Header */}
          <div className="mb-12 flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6">
            <Avatar className="h-24 w-24 border-2 border-bone">
              <AvatarImage src={author.avatar_url || undefined} alt={author.display_name || "Author"} />
              <AvatarFallback className="text-2xl bg-granite text-parchment">
                {(author.display_name || "A").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="mb-2 font-serif text-3xl font-bold tracking-tight text-granite md:text-4xl">
                {author.display_name || "Anonymous Contributor"}
              </h1>
              
              <div className="mb-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-stone">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Member since {memberSince}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {stories.length} {stories.length === 1 ? "story" : "stories"}
                </span>
              </div>

              {author.bio && (
                <p className="max-w-2xl text-stone leading-relaxed">
                  {author.bio}
                </p>
              )}
            </div>
          </div>

          {/* Stories */}
          <section>
            <h2 className="mb-6 font-serif text-2xl font-bold text-granite">
              Stories by {author.display_name || "this contributor"}
            </h2>

            {stories.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {stories.map((story) => (
                  <StoryCard key={story.id} story={convertStory(story)} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-bone py-16 text-center">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-stone/30" />
                <p className="text-stone">
                  No public stories yet.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

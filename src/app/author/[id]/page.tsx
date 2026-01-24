import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoryCard } from "@/components/story/story-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MapPin, Calendar, BookOpen, Award, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { StoryWithDetails } from "@/types";
import { UserComments } from "@/components/profile/user-comments";

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

interface UserBadge {
  badge_type: string;
  awarded_at: string;
}

// Badge display info
const BADGE_INFO: Record<string, { emoji: string; name: string; color: string }> = {
  first_story: { emoji: "📝", name: "First Story", color: "bg-blue-100 text-blue-700" },
  storyteller_5: { emoji: "✍️", name: "Storyteller", color: "bg-green-100 text-green-700" },
  storyteller_10: { emoji: "📚", name: "Prolific Writer", color: "bg-purple-100 text-purple-700" },
  storyteller_25: { emoji: "🏆", name: "Master Storyteller", color: "bg-yellow-100 text-yellow-700" },
  voice_keeper: { emoji: "🎙️", name: "Voice Keeper", color: "bg-red-100 text-red-700" },
  memory_keeper: { emoji: "⏳", name: "Memory Keeper", color: "bg-amber-100 text-amber-700" },
  local_legend: { emoji: "🗺️", name: "Local Legend", color: "bg-teal-100 text-teal-700" },
  community_star: { emoji: "⭐", name: "Community Star", color: "bg-orange-100 text-orange-700" },
  ambassador: { emoji: "🎖️", name: "Ambassador", color: "bg-indigo-100 text-indigo-700" },
  founding_member: { emoji: "🌟", name: "Founding Member", color: "bg-pink-100 text-pink-700" },
  helpful_voice: { emoji: "💬", name: "Helpful Voice", color: "bg-cyan-100 text-cyan-700" },
  popular_story: { emoji: "❤️", name: "Popular Story", color: "bg-rose-100 text-rose-700" },
  location_expert: { emoji: "📍", name: "Location Expert", color: "bg-atlantic/20 text-atlantic" },
  prompt_responder: { emoji: "💡", name: "Prompt Responder", color: "bg-yellow-100 text-yellow-700" },
  community_voter: { emoji: "🗳️", name: "Community Voter", color: "bg-indigo-100 text-indigo-700" },
  poll_winner: { emoji: "🥇", name: "Poll Winner", color: "bg-amber-100 text-amber-700" },
  early_supporter: { emoji: "⭐", name: "Early Supporter", color: "bg-rose-100 text-rose-700" },
};

async function getAuthorProfile(id: string): Promise<Author | null> {
  // Use admin client to bypass RLS for public profile viewing
  const supabase = createAdminClient();
  if (!supabase) {
    console.error("[Author] Admin client not available");
    return null;
  }
  
  const { data, error } = await supabase
    .from("users")
    .select("id, display_name, avatar_url, bio, created_at")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("[Author] Error fetching profile:", error);
    return null;
  }
  return data;
}

async function getAuthorStories(authorId: string): Promise<Story[]> {
  // Use admin client to bypass RLS for public stories
  const supabase = createAdminClient();
  if (!supabase) {
    console.error("[Author] Admin client not available");
    return [];
  }
  
  const { data, error } = await supabase
    .from("stories")
    .select("*, likes(count), comments(count)")
    .eq("author_id", authorId)
    .eq("status", "published")
    .eq("soft_deleted", false)
    .eq("anonymous", false) // Only show non-anonymous stories on profile
    .order("published_at", { ascending: false });

  if (error) {
    console.error("[Author] Error fetching stories:", error);
    return [];
  }

  return (data || []).map((story: any) => ({
    ...story,
    likes_count: Array.isArray(story.likes) ? story.likes[0]?.count || 0 : 0,
    comments_count: Array.isArray(story.comments) ? story.comments[0]?.count || 0 : 0,
  }));
}

async function getAuthorBadges(authorId: string): Promise<UserBadge[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];
  
  const { data, error } = await (supabase
    .from("user_badges") as any)
    .select("badge_type, awarded_at")
    .eq("user_id", authorId)
    .order("awarded_at", { ascending: false });

  if (error) {
    console.error("[Author] Error fetching badges:", error);
    return [];
  }
  return data || [];
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
  const [author, stories, badges] = await Promise.all([
    getAuthorProfile(id),
    getAuthorStories(id),
    getAuthorBadges(id),
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

              {/* Badges */}
              {badges.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {badges.map((badge) => {
                    const info = BADGE_INFO[badge.badge_type];
                    if (!info) return null;
                    return (
                      <Badge 
                        key={badge.badge_type}
                        className={`${info.color} gap-1`}
                      >
                        <span>{info.emoji}</span>
                        {info.name}
                      </Badge>
                    );
                  })}
                </div>
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

          {/* Comments */}
          <section className="mt-12">
            <h2 className="mb-6 font-serif text-2xl font-bold text-granite flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Comments by {author.display_name || "this contributor"}
            </h2>
            <UserComments 
              userId={id} 
              displayName={author.display_name || "Anonymous"} 
            />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

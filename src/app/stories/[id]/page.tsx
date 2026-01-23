import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ShareButtons } from "@/components/community/share-buttons";
import { LikeButton } from "@/components/community/like-button";
import { CommentSection } from "@/components/community/comment-section";
import { AdminReviewPanel } from "@/components/admin/review-panel";
import { AmbientPlayer } from "@/components/story/ambient-player";
import { StoryReader } from "@/components/story/story-reader";
import { MapPin, Calendar, ArrowLeft, Eye, AlertTriangle } from "lucide-react";
import { getStoryById, getStoryComments, hasUserLikedStory, getRelatedStories } from "@/lib/supabase/queries";
import { StoryCard } from "@/components/story/story-card";
import type { StoryWithDetails } from "@/types";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

// Extract first image from story body
function extractFirstImage(body: string | null, siteUrl: string): string | null {
  if (!body) return null;
  const imgMatch = body.match(/<img[^>]+src="([^">]+)"/);
  if (!imgMatch) return null;
  
  let imageUrl = imgMatch[1];
  
  // Ensure the URL is absolute for social sharing
  if (imageUrl.startsWith('/')) {
    imageUrl = `${siteUrl}${imageUrl}`;
  } else if (!imageUrl.startsWith('http')) {
    imageUrl = `${siteUrl}/${imageUrl}`;
  }
  
  return imageUrl;
}

// Also check for video thumbnails as fallback
function extractVideoThumbnail(body: string | null): string | null {
  if (!body) return null;
  
  // YouTube
  const ytMatch = body.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (ytMatch) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
  }
  
  // Vimeo (would need API call, skip for now)
  return null;
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  const story = await getStoryById(id);
  
  if (!story) {
    return {
      title: "Story Not Found",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://peopleofcornwall.com";
  const description = story.ai_summary || story.body?.replace(/<[^>]*>/g, "").slice(0, 160) + "...";
  
  // Try to get image from story, or fallback to video thumbnail
  let imageUrl = extractFirstImage(story.body, siteUrl);
  if (!imageUrl) {
    imageUrl = extractVideoThumbnail(story.body);
  }

  return {
    title: `${story.title} | People of Cornwall`,
    description,
    openGraph: {
      title: story.title,
      description,
      type: "article",
      publishedTime: story.published_at || undefined,
      authors: story.anonymous ? undefined : [story.author_display_name || "Anonymous"],
      siteName: "People of Cornwall",
      url: `${siteUrl}/stories/${id}`,
      images: imageUrl ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: story.title,
        }
      ] : [
        {
          url: `${siteUrl}/og-default.png`,
          width: 1200,
          height: 630,
          alt: "People of Cornwall",
        }
      ],
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: story.title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function StoryPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const story = await getStoryById(id);

  // Get current user and check if admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let isAdmin = false;
  let isAuthor = false;
  
  if (user) {
    // Check if admin
    const { data: profile } = await (supabase
      .from("users") as any)
      .select("role")
      .eq("id", user.id)
      .single();
    
    isAdmin = profile?.role === "admin";
    isAuthor = story?.author_id === user.id;
  }

  // Allow viewing if: published OR admin OR author
  const canView = story && (story.status === "published" || isAdmin || isAuthor);
  
  if (!story || !canView) {
    notFound();
  }

  const isPreview = story.status !== "published";

  // Get comments (only for published stories) - pass userId to check likes
  const comments = story.status === "published" ? await getStoryComments(id, user?.id) : [];

  // Check if current user has liked
  const hasLiked = user ? await hasUserLikedStory(id, user.id) : false;

  // Get related stories (only for published stories)
  const relatedStories = story.status === "published" 
    ? await getRelatedStories(id, story.ai_tags, story.location_name, story.timeline_decade, 3)
    : [];

  // Convert to StoryWithDetails for StoryCard
  const relatedStoriesForCard: StoryWithDetails[] = relatedStories.map((s) => ({
    ...s,
    author: null,
    media: [],
    has_liked: false,
  }) as StoryWithDetails);

  const authorName = story.anonymous
    ? "Anonymous"
    : story.author_display_name || "A Cornish voice";
  
  // Link to author profile if not anonymous
  const authorLink = !story.anonymous && story.author_id ? `/author/${story.author_id}` : null;

  const recordedDate = story.published_at
    ? new Date(story.published_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://peopleofcornwall.com";
  const storyUrl = `${siteUrl}/stories/${id}`;

  const statusLabels: Record<string, string> = {
    draft: "Draft",
    review: "Pending Review",
    rejected: "Needs Changes",
    unpublished: "Unpublished",
  };

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1">
        {/* Preview Banner */}
        {isPreview && (
          <div className="border-b border-copper-light/30 bg-copper/5">
            <div className="mx-auto max-w-[680px] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Eye className="h-4 w-4 text-copper" />
                  <span className="text-sm font-medium text-copper">
                    Preview Mode
                  </span>
                  <span className="rounded-full bg-copper/10 px-2.5 py-0.5 text-xs font-medium text-copper">
                    {statusLabels[story.status] || story.status}
                  </span>
                </div>
                <p className="text-xs text-copper/80">
                  {isAdmin && !isAuthor 
                    ? "Viewing as admin"
                    : "Not published yet"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mx-auto max-w-[680px] px-4 pt-10">
          <Link
            href={isPreview && isAdmin ? "/admin/review" : "/stories"}
            className="inline-flex items-center gap-1 text-sm text-stone hover:text-granite transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {isPreview && isAdmin ? "Back to review" : "All stories"}
          </Link>
        </div>

        {/* Story Article */}
        <article className="mx-auto max-w-[680px] px-4 py-10">
          {/* Meta line */}
          <div className="mb-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-stone">
            {story.timeline_decade && (
              <span>{story.timeline_decade}s</span>
            )}
            {story.timeline_decade && story.location_name && (
              <span className="text-silver">•</span>
            )}
            {story.location_name && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {story.location_name}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="mb-8 font-serif text-4xl font-bold leading-tight tracking-tight text-granite md:text-5xl">
            {story.title}
          </h1>

          {/* Author & Date */}
          <div className="mb-10 flex flex-wrap items-center gap-4 text-sm">
            <span className="text-granite">
              By{" "}
              {authorLink ? (
                <Link 
                  href={authorLink} 
                  className="hover:text-slate underline underline-offset-2 decoration-bone hover:decoration-slate transition-colors"
                >
                  {authorName}
                </Link>
              ) : (
                authorName
              )}
            </span>
            {recordedDate && (
              <span className="flex items-center gap-1.5 text-stone">
                <Calendar className="h-4 w-4" />
                {recordedDate}
              </span>
            )}
          </div>

          {/* Listen to Story / Ambient Sound */}
          <div className="mb-8 space-y-4">
            {/* Text-to-Speech Reader */}
            {story.status === "published" && (
              <StoryReader 
                storyBody={story.body || ""}
                storyTitle={story.title}
                voicePreference={(story.voice_preference as "male" | "female") || "male"}
                ambientSoundId={story.ambient_sound}
              />
            )}
            
            {/* Standalone Ambient Sound (only if no TTS or for preview mode) */}
            {story.ambient_sound && story.status !== "published" && (
              <AmbientPlayer soundId={story.ambient_sound} />
            )}
          </div>

          {/* Curator's Note (AI Summary) */}
          {story.ai_summary && (
            <div className="mb-10 border-l-2 border-copper pl-5">
              <p className="text-xs font-medium uppercase tracking-widest text-copper mb-2">
                About this story
              </p>
              <p className="font-serif text-lg italic text-stone leading-relaxed">
                {story.ai_summary}
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="mb-10 h-px bg-bone" />

          {/* Story Body */}
          <div
            className="prose story-content"
            dangerouslySetInnerHTML={{ __html: story.body || "" }}
          />

          {/* Divider */}
          <div className="my-10 h-px bg-bone" />

          {/* Tags */}
          {story.ai_tags && story.ai_tags.length > 0 && (
            <div className="mb-10">
              <h3 className="mb-4 text-xs font-medium uppercase tracking-widest text-stone">
                Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {story.ai_tags.map((tag) => (
                  <Link 
                    key={tag} 
                    href={`/stories?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full bg-bone px-3 py-1.5 text-sm text-slate hover:bg-granite hover:text-parchment transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Admin Review Panel */}
          {isAdmin && story.status === "review" && (
            <div className="mb-10">
              <AdminReviewPanel 
                storyId={story.id} 
                storyStatus={story.status}
                storyTitle={story.title}
                storyBody={story.body || ""}
                currentSummary={story.ai_summary}
                currentTags={story.ai_tags}
                hasImage={!!extractFirstImage(story.body, siteUrl)}
              />
            </div>
          )}

          {/* Engagement & Share */}
          {!isPreview ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-cream p-5">
                <div className="flex items-center gap-4">
                  <LikeButton
                    storyId={story.id}
                    initialLiked={hasLiked}
                    initialCount={story.likes_count}
                  />
                  <span className="text-sm text-stone">
                    {story.comments_count} {story.comments_count === 1 ? "comment" : "comments"}
                  </span>
                </div>
                <ShareButtons
                  url={storyUrl}
                  title={story.title}
                  description={story.ai_summary || undefined}
                />
              </div>

              {/* Comments */}
              <CommentSection
                storyId={story.id}
                initialComments={comments}
              />
            </>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-copper/20 bg-copper/5 p-5">
              <AlertTriangle className="h-5 w-5 text-copper" />
              <p className="text-sm text-copper">
                Engagement features will be available once this story is published.
              </p>
            </div>
          )}

          {/* Related Stories */}
          {!isPreview && relatedStoriesForCard.length > 0 && (
            <section className="mt-16 border-t border-bone pt-12">
              <h2 className="mb-8 font-serif text-2xl font-bold tracking-tight text-granite">
                More stories you might enjoy
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedStoriesForCard.map((relatedStory) => (
                  <StoryCard key={relatedStory.id} story={relatedStory} />
                ))}
              </div>
            </section>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ShareButtons } from "@/components/community/share-buttons";
import { LikeButton } from "@/components/community/like-button";
import { CommentSection } from "@/components/community/comment-section";
import { AdminReviewPanel } from "@/components/admin/review-panel";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, ArrowLeft, Eye, AlertTriangle } from "lucide-react";
import { getStoryById, getStoryComments, hasUserLikedStory } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

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

  const description = story.ai_summary || story.body?.replace(/<[^>]*>/g, "").slice(0, 160);

  return {
    title: story.title,
    description,
    openGraph: {
      title: story.title,
      description,
      type: "article",
      publishedTime: story.published_at || undefined,
      authors: story.anonymous ? undefined : [story.author_display_name || "Anonymous"],
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
    const { data: profile } = await supabase
      .from("users")
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

  // Get comments (only for published stories)
  const comments = story.status === "published" ? await getStoryComments(id) : [];

  // Check if current user has liked
  const hasLiked = user ? await hasUserLikedStory(id, user.id) : false;

  const authorName = story.anonymous
    ? "Anonymous contributor"
    : story.author_display_name || "A Cornish voice";

  const recordedDate = story.published_at
    ? new Date(story.published_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const storyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/stories/${id}`;

  const statusLabels: Record<string, string> = {
    draft: "Draft",
    review: "Pending Review",
    rejected: "Needs Changes",
    unpublished: "Unpublished",
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Preview Banner */}
        {isPreview && (
          <div className="border-b border-amber-200 bg-amber-50">
            <div className="mx-auto max-w-3xl px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-800">
                    Preview Mode
                  </span>
                  <Badge className="bg-amber-100 text-amber-700">
                    {statusLabels[story.status] || story.status}
                  </Badge>
                </div>
                <p className="text-sm text-amber-700">
                  {isAdmin && !isAuthor 
                    ? "You're viewing this as an admin. This story is not public."
                    : "This story is not published yet."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mx-auto max-w-3xl px-4 pt-8">
          <Link
            href={isPreview && isAdmin ? "/admin/review" : "/stories"}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {isPreview && isAdmin ? "Back to review queue" : "Back to stories"}
          </Link>
        </div>

        {/* Story Header */}
        <article className="mx-auto max-w-3xl px-4 py-8">
          {/* Historical markers */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {story.timeline_decade && (
              <span className="historical-marker">{story.timeline_decade}s</span>
            )}
            {story.location_name && (
              <span className="provenance">
                <MapPin className="h-3.5 w-3.5" />
                {story.location_name}
              </span>
            )}
          </div>

          {/* Title (Plaque) */}
          <h1 className="plaque mb-6 text-4xl md:text-5xl">{story.title}</h1>

          {/* Author & Date */}
          <div className="mb-8 flex flex-wrap items-center gap-4">
            <span className="signature text-base">{authorName}</span>
            {recordedDate && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Recorded {recordedDate}
              </span>
            )}
          </div>

          {/* Curator's Note (AI Summary) */}
          {story.ai_summary && (
            <div className="curator-note mb-8">{story.ai_summary}</div>
          )}

          <Separator className="mb-8" />

          {/* Story Body */}
          <div
            className="story-content"
            dangerouslySetInnerHTML={{ __html: story.body || "" }}
          />

          <Separator className="my-8" />

          {/* Archive Labels (Tags) */}
          {story.ai_tags && story.ai_tags.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Archive Labels
              </h3>
              <div className="flex flex-wrap gap-2">
                {story.ai_tags.map((tag) => (
                  <Link key={tag} href={`/stories?tag=${encodeURIComponent(tag)}`}>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer bg-sea-foam-light text-moss-green-dark hover:bg-sea-foam"
                    >
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Admin Review Panel - Only for admins reviewing stories */}
          {isAdmin && story.status === "review" && (
            <div className="mb-8">
              <AdminReviewPanel storyId={story.id} storyStatus={story.status} />
            </div>
          )}

          {/* Engagement & Share - Only for published stories */}
          {!isPreview ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-chalk-white-dark/50 p-4">
                <div className="flex items-center gap-4">
                  <LikeButton
                    storyId={story.id}
                    initialLiked={hasLiked}
                    initialCount={story.likes_count}
                  />
                  <span className="text-sm text-muted-foreground">
                    {story.comments_count} {story.comments_count === 1 ? "comment" : "comments"}
                  </span>
                </div>
                <ShareButtons
                  url={storyUrl}
                  title={story.title}
                  description={story.ai_summary || undefined}
                />
              </div>

              {/* Comments section */}
              <CommentSection
                storyId={story.id}
                initialComments={comments}
              />
            </>
          ) : (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="flex items-center gap-3 py-4">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <p className="text-sm text-amber-700">
                  Likes, shares, and comments will be available once this story is published.
                </p>
              </CardContent>
            </Card>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}

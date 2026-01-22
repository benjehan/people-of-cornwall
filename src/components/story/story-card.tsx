import Link from "next/link";
import Image from "next/image";
import { MapPin, Heart, MessageCircle, ImageIcon } from "lucide-react";
import type { StoryWithDetails } from "@/types";

interface StoryCardProps {
  story: StoryWithDetails & { first_image_url?: string | null };
  featured?: boolean;
  showImage?: boolean;
}

/**
 * Story Card — Clean, minimal design with optional image thumbnail
 */
export function StoryCard({ story, featured = false, showImage = true }: StoryCardProps) {
  const authorName = story.anonymous
    ? "Anonymous"
    : story.author_display_name || "A Cornish voice";

  // Format the date
  const recordedDate = story.published_at
    ? new Date(story.published_at).toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      })
    : null;

  // Extract first paragraph for excerpt (strip HTML)
  const excerpt = story.body
    ? story.body.replace(/<[^>]*>/g, "").slice(0, 160) + "..."
    : null;

  // Get image URL - check for first_image_url or extract from body
  const imageUrl = story.first_image_url || extractImageFromBody(story.body);

  if (featured) {
    // Featured card with large image
    return (
      <Link href={`/stories/${story.id}`} className="group block">
        <article className="overflow-hidden rounded-lg border border-bone bg-cream transition-all hover:border-granite hover:shadow-lg">
          {/* Image */}
          {showImage && imageUrl && (
            <div className="relative h-64 w-full overflow-hidden bg-bone md:h-80">
              <img
                src={imageUrl}
                alt={story.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-granite/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-parchment/80">
                  <span className="font-medium">Featured</span>
                  {story.timeline_decade && (
                    <>
                      <span>•</span>
                      <span>{story.timeline_decade}s</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="p-8 md:p-10">
            {/* Meta line (only if no image) */}
            {(!showImage || !imageUrl) && (
              <div className="mb-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-stone">
                <span className="text-copper font-medium">Featured</span>
                {story.timeline_decade && (
                  <>
                    <span className="text-silver">•</span>
                    <span>{story.timeline_decade}s</span>
                  </>
                )}
                {story.location_name && (
                  <>
                    <span className="text-silver">•</span>
                    <span>{story.location_name}</span>
                  </>
                )}
              </div>
            )}

            {/* Title */}
            <h2 className="mb-4 font-serif text-3xl font-bold leading-tight tracking-tight text-granite group-hover:text-slate transition-colors md:text-4xl">
              {story.title}
            </h2>

            {/* Excerpt */}
            {excerpt && (
              <p className="mb-6 max-w-2xl font-serif text-lg leading-relaxed text-slate">
                {excerpt}
              </p>
            )}

            {/* Author & engagement */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-sm text-stone">
                By {authorName}
                {recordedDate && <span className="ml-2 text-silver">· {recordedDate}</span>}
              </span>
              <div className="flex items-center gap-4 text-sm text-stone">
                <span className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4" />
                  {story.likes_count || 0}
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4" />
                  {story.comments_count || 0}
                </span>
              </div>
            </div>

            {/* Tags */}
            {story.ai_tags && story.ai_tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {story.ai_tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-bone px-3 py-1 text-xs text-slate"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>
      </Link>
    );
  }

  // Regular card - horizontal layout with image thumbnail
  if (showImage && imageUrl) {
    return (
      <Link href={`/stories/${story.id}`} className="group block h-full">
        <article className="flex h-full flex-col overflow-hidden rounded-lg border border-transparent bg-parchment transition-all hover:border-bone hover:bg-cream hover:shadow-sm">
          {/* Image thumbnail */}
          <div className="relative h-40 w-full overflow-hidden bg-bone">
            <img
              src={imageUrl}
              alt={story.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          
          <div className="flex flex-1 flex-col p-5">
            {/* Meta line */}
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-silver">
              {story.timeline_decade && <span>{story.timeline_decade}s</span>}
              {story.timeline_decade && story.location_name && <span>•</span>}
              {story.location_name && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{story.location_name}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="mb-2 font-serif text-lg font-bold leading-snug tracking-tight text-granite group-hover:text-slate transition-colors line-clamp-2">
              {story.title}
            </h3>

            {/* Excerpt */}
            {excerpt && (
              <p className="mb-3 flex-1 text-sm leading-relaxed text-stone line-clamp-2">
                {excerpt}
              </p>
            )}

            {/* Author & stats */}
            <div className="mt-auto flex items-center justify-between pt-3 border-t border-bone">
              <span className="text-xs text-stone truncate">
                {authorName}
              </span>
              <div className="flex items-center gap-2 text-xs text-silver">
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {story.likes_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {story.comments_count || 0}
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Regular card without image
  return (
    <Link href={`/stories/${story.id}`} className="group block h-full">
      <article className="flex h-full flex-col rounded-lg border border-transparent bg-parchment p-6 transition-all hover:border-bone hover:bg-cream">
        {/* Meta line */}
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-silver">
          {story.timeline_decade && <span>{story.timeline_decade}s</span>}
          {story.timeline_decade && story.location_name && <span>•</span>}
          {story.location_name && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {story.location_name}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-3 font-serif text-xl font-bold leading-snug tracking-tight text-granite group-hover:text-slate transition-colors line-clamp-2">
          {story.title}
        </h3>

        {/* Excerpt */}
        {excerpt && (
          <p className="mb-4 flex-1 text-sm leading-relaxed text-stone line-clamp-3">
            {excerpt}
          </p>
        )}

        {/* Author */}
        <div className="mt-auto pt-4 border-t border-bone">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone">
              {authorName}
            </span>
            <div className="flex items-center gap-3 text-xs text-silver">
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {story.likes_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                {story.comments_count || 0}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

/**
 * Extract first image URL from story body HTML
 */
function extractImageFromBody(body: string | null): string | null {
  if (!body) return null;
  const imgMatch = body.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : null;
}

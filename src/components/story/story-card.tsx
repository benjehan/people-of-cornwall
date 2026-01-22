import Link from "next/link";
import { MapPin, Heart, MessageCircle } from "lucide-react";
import type { StoryWithDetails } from "@/types";

interface StoryCardProps {
  story: StoryWithDetails;
  featured?: boolean;
}

/**
 * Story Card — Clean, minimal design with strong typography
 */
export function StoryCard({ story, featured = false }: StoryCardProps) {
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
    ? story.body.replace(/<[^>]*>/g, "").slice(0, 180) + "..."
    : null;

  if (featured) {
    // Featured card is handled differently in the homepage now
    return (
      <Link href={`/stories/${story.id}`} className="group block">
        <article className="rounded-lg border border-bone bg-cream p-8 transition-all hover:border-granite hover:shadow-lg md:p-10">
          {/* Meta line */}
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

          {/* Title */}
          <h2 className="mb-4 font-serif text-3xl font-bold leading-tight tracking-tight text-granite group-hover:text-copper transition-colors md:text-4xl">
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
        </article>
      </Link>
    );
  }

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
        <h3 className="mb-3 font-serif text-xl font-bold leading-snug tracking-tight text-granite group-hover:text-copper transition-colors line-clamp-2">
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

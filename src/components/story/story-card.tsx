import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Heart, MessageCircle, Share2 } from "lucide-react";
import { ShareButtons } from "@/components/community/share-buttons";
import type { StoryWithDetails } from "@/types";

interface StoryCardProps {
  story: StoryWithDetails;
  featured?: boolean;
}

/**
 * Artefact Card — Story preview with museum-inspired plaque typography
 */
export function StoryCard({ story, featured = false }: StoryCardProps) {
  const authorName = story.anonymous
    ? "Anonymous contributor"
    : story.author_display_name || "A Cornish voice";

  // Format the date as "Recorded in Month Year"
  const recordedDate = story.published_at
    ? new Date(story.published_at).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
    : null;

  // Extract first paragraph for excerpt
  const excerpt = story.body
    ? story.body.replace(/<[^>]*>/g, "").slice(0, 200) + "..."
    : null;

  if (featured) {
    return (
      <Link href={`/stories/${story.id}`} className="group block">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-atlantic-blue to-atlantic-blue-dark text-chalk-white shadow-xl transition-all duration-300 hover:shadow-2xl">
          <CardContent className="p-8 md:p-12">
            {/* Historical Marker */}
            <div className="mb-4 flex items-center gap-4">
              <span className="historical-marker text-sea-foam">
                Featured Exhibition
              </span>
              {story.timeline_decade && (
                <span className="historical-marker text-sea-foam/80">
                  {story.timeline_decade}s
                </span>
              )}
            </div>

            {/* Plaque — Title */}
            <h2 className="plaque mb-4 text-3xl text-chalk-white md:text-4xl">
              {story.title}
            </h2>

            {/* Excerpt */}
            {excerpt && (
              <p className="mb-6 max-w-2xl font-serif text-lg leading-relaxed text-chalk-white/90">
                {excerpt}
              </p>
            )}

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Signature */}
              <span className="signature text-sea-foam">{authorName}</span>

              {/* Provenance */}
              {story.location_name && (
                <span className="flex items-center gap-1 text-sm text-sea-foam/80">
                  <MapPin className="h-4 w-4" />
                  {story.location_name}
                </span>
              )}

              {/* Recorded date */}
              {recordedDate && (
                <span className="historical-marker text-sea-foam/80">
                  Recorded in {recordedDate}
                </span>
              )}
            </div>

            {/* Archive Labels */}
            {story.ai_tags && story.ai_tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {story.ai_tags.slice(0, 4).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-chalk-white/20 text-chalk-white hover:bg-chalk-white/30"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/stories/${story.id}`} className="group block">
      <Card className="artefact-card h-full border-chalk-white-dark bg-chalk-white">
        <CardContent className="p-6">
          {/* Historical Marker */}
          <div className="mb-3 flex items-center gap-3">
            {story.timeline_decade && (
              <span className="historical-marker">{story.timeline_decade}s</span>
            )}
            {recordedDate && (
              <span className="historical-marker">Recorded in {recordedDate}</span>
            )}
          </div>

          {/* Plaque — Title */}
          <h3 className="plaque mb-3 line-clamp-2 group-hover:text-atlantic-blue">
            {story.title}
          </h3>

          {/* Excerpt */}
          {excerpt && (
            <p className="mb-4 line-clamp-3 font-serif text-base leading-relaxed text-slate-grey-light">
              {excerpt}
            </p>
          )}

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Signature */}
            <span className="signature">{authorName}</span>

            {/* Provenance */}
            {story.location_name && (
              <span className="provenance text-xs">
                <MapPin className="h-3 w-3" />
                {story.location_name}
              </span>
            )}
          </div>

          {/* Archive Labels */}
          {story.ai_tags && story.ai_tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {story.ai_tags.slice(0, 3).map((tag) => (
                <span key={tag} className="archive-label">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Engagement — subtle, not prominent */}
          <div className="mt-4 flex items-center gap-4 border-t border-chalk-white-dark pt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {story.likes_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {story.comments_count || 0}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

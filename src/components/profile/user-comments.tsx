"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, BookOpen, Calendar, Camera, MapPin, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Comment {
  id: string;
  body: string;
  content_type: string;
  content_id: string;
  created_at: string;
  // Related content info (filled in separately)
  content_title?: string;
  content_url?: string;
}

interface UserCommentsProps {
  userId: string;
  displayName?: string;
  isOwnProfile?: boolean;
}

const CONTENT_TYPE_INFO = {
  story: { icon: BookOpen, label: "Stories", color: "text-copper" },
  event: { icon: Calendar, label: "Events", color: "text-granite" },
  lost_cornwall: { icon: Camera, label: "Lost Cornwall", color: "text-sepia" },
  where_is_this: { icon: MapPin, label: "Where Is This", color: "text-atlantic" },
};

export function UserComments({ userId, displayName, isOwnProfile = false }: UserCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data, error } = await (supabase
      .from("comments") as any)
      .select(`
        id,
        body,
        content_type,
        content_id,
        created_at
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error loading comments:", error);
      setIsLoading(false);
      return;
    }

    // Enrich comments with content titles and URLs
    const enrichedComments = await Promise.all(
      (data || []).map(async (comment: Comment) => {
        let content_title = "Unknown";
        let content_url = "#";

        try {
          if (comment.content_type === "story") {
            const { data: story } = await (supabase.from("stories") as any)
              .select("title")
              .eq("id", comment.content_id)
              .single();
            if (story) {
              content_title = story.title;
              content_url = `/stories/${comment.content_id}`;
            }
          } else if (comment.content_type === "event") {
            const { data: event } = await (supabase.from("events") as any)
              .select("title")
              .eq("id", comment.content_id)
              .single();
            if (event) {
              content_title = event.title;
              content_url = `/events/${comment.content_id}`;
            }
          } else if (comment.content_type === "lost_cornwall") {
            const { data: photo } = await (supabase.from("lost_cornwall") as any)
              .select("title")
              .eq("id", comment.content_id)
              .single();
            if (photo) {
              content_title = photo.title;
              content_url = `/lost-cornwall?photo=${comment.content_id}`;
            }
          } else if (comment.content_type === "where_is_this") {
            content_title = "Location Challenge";
            content_url = `/where-is-this`;
          }
        } catch (err) {
          console.error("Error enriching comment:", err);
        }

        return {
          ...comment,
          content_title,
          content_url,
        };
      })
    );

    setComments(enrichedComments);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const filteredComments = activeTab === "all" 
    ? comments 
    : comments.filter(c => c.content_type === activeTab);

  const commentCounts = {
    all: comments.length,
    story: comments.filter(c => c.content_type === "story").length,
    event: comments.filter(c => c.content_type === "event").length,
    lost_cornwall: comments.filter(c => c.content_type === "lost_cornwall").length,
    where_is_this: comments.filter(c => c.content_type === "where_is_this").length,
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  if (isLoading) {
    return (
      <Card className="border-bone bg-cream">
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-granite mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (comments.length === 0) {
    return (
      <Card className="border-bone bg-cream">
        <CardContent className="py-8 text-center">
          <MessageCircle className="h-8 w-8 text-stone/30 mx-auto mb-2" />
          <p className="text-stone">
            {isOwnProfile 
              ? "You haven't made any comments yet." 
              : `${displayName || "This user"} hasn't made any comments yet.`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-bone bg-cream overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-bone px-4 py-3">
          <TabsList className="bg-parchment h-auto flex-wrap gap-1">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-granite data-[state=active]:text-parchment"
            >
              All ({commentCounts.all})
            </TabsTrigger>
            {Object.entries(CONTENT_TYPE_INFO).map(([key, info]) => {
              const count = commentCounts[key as keyof typeof commentCounts] || 0;
              if (count === 0) return null;
              const Icon = info.icon;
              return (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="data-[state=active]:bg-granite data-[state=active]:text-parchment"
                >
                  <Icon className="h-3.5 w-3.5 mr-1" />
                  {info.label} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <CardContent className="p-4">
          <div className="space-y-4">
            {filteredComments.length === 0 ? (
              <p className="text-center text-stone py-4">No comments in this category.</p>
            ) : (
              filteredComments.map((comment) => {
                const typeInfo = CONTENT_TYPE_INFO[comment.content_type as keyof typeof CONTENT_TYPE_INFO] 
                  || { icon: MessageCircle, label: comment.content_type, color: "text-stone" };
                const TypeIcon = typeInfo.icon;

                return (
                  <div 
                    key={comment.id} 
                    className="p-4 rounded-lg bg-parchment border border-bone hover:border-granite/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className={`${typeInfo.color} border-current/30 flex-shrink-0`}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {typeInfo.label}
                        </Badge>
                        <span className="text-xs text-silver flex-shrink-0">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      {comment.content_url && comment.content_url !== "#" && (
                        <Link 
                          href={comment.content_url}
                          className="text-xs text-granite hover:text-copper flex items-center gap-1 flex-shrink-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </Link>
                      )}
                    </div>

                    {comment.content_title && (
                      <p className="text-sm font-medium text-granite mb-2 line-clamp-1">
                        On: {comment.content_title}
                      </p>
                    )}

                    <p className="text-stone text-sm whitespace-pre-wrap line-clamp-3">
                      {comment.body}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Tabs>
    </Card>
  );
}

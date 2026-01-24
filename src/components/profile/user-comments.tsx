"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
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
  content_title?: string;
  content_url?: string;
}

interface UserCommentsProps {
  userId: string;
  displayName?: string;
  isOwnProfile?: boolean;
}

const CONTENT_TYPE_TABS = [
  { key: "story", icon: BookOpen, label: "Stories", color: "text-copper", bgColor: "bg-copper/10" },
  { key: "event", icon: Calendar, label: "Events", color: "text-granite", bgColor: "bg-granite/10" },
  { key: "lost_cornwall", icon: Camera, label: "Lost Cornwall", color: "text-sepia", bgColor: "bg-sepia/10" },
  { key: "where_is_this", icon: MapPin, label: "Where Is This", color: "text-atlantic", bgColor: "bg-atlantic/10" },
];

export function UserComments({ userId, displayName, isOwnProfile = false }: UserCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("story"); // Default to Stories tab

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    // Story comments use story_id directly (original schema)
    const { data: storyComments, error: storyError } = await (supabase
      .from("comments") as any)
      .select(`
        id,
        body,
        story_id,
        created_at,
        story:stories!story_id(id, title)
      `)
      .eq("user_id", userId)
      .not("story_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (storyError) {
      console.error("Error loading story comments:", storyError);
    }

    // Transform story comments
    const transformedStoryComments: Comment[] = (storyComments || []).map((c: any) => ({
      id: c.id,
      body: c.body,
      content_type: "story",
      content_id: c.story_id,
      created_at: c.created_at,
      content_title: c.story?.title || "Deleted story",
      content_url: c.story?.id ? `/stories/${c.story.id}` : "#",
    }));

    // Polymorphic comments for events, lost_cornwall, where_is_this
    // These use content_type and content_id (added in migration 017)
    const { data: otherComments, error: otherError } = await (supabase
      .from("comments") as any)
      .select(`
        id,
        body,
        content_type,
        content_id,
        created_at
      `)
      .eq("user_id", userId)
      .not("content_type", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (otherError) {
      console.error("Error loading other comments:", otherError);
    }

    // Enrich other comments with titles
    const enrichedOtherComments = await Promise.all(
      (otherComments || []).map(async (comment: any) => {
        let content_title = "";
        let content_url = "#";

        try {
          if (comment.content_type === "event") {
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
            const { data: challenge } = await (supabase.from("where_is_this") as any)
              .select("hint")
              .eq("id", comment.content_id)
              .single();
            content_title = challenge?.hint ? `Challenge: ${challenge.hint.slice(0, 30)}...` : "Location Challenge";
            content_url = `/where-is-this`;
          }
        } catch (err) {
          console.error("Error enriching comment:", err);
        }

        return {
          id: comment.id,
          body: comment.body,
          content_type: comment.content_type,
          content_id: comment.content_id,
          created_at: comment.created_at,
          content_title: content_title || "Unknown",
          content_url,
        };
      })
    );

    // Combine and set all comments
    const allComments = [...transformedStoryComments, ...enrichedOtherComments];
    setComments(allComments);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Filter comments by active tab
  const filteredComments = comments.filter(c => c.content_type === activeTab);

  // Count per type
  const commentCounts = CONTENT_TYPE_TABS.reduce((acc, tab) => {
    acc[tab.key] = comments.filter(c => c.content_type === tab.key).length;
    return acc;
  }, {} as Record<string, number>);

  const totalComments = comments.length;

  // Find first tab with comments as default
  useEffect(() => {
    if (!isLoading && comments.length > 0) {
      const firstTabWithComments = CONTENT_TYPE_TABS.find(tab => commentCounts[tab.key] > 0);
      if (firstTabWithComments && commentCounts[activeTab] === 0) {
        setActiveTab(firstTabWithComments.key);
      }
    }
  }, [isLoading, comments, commentCounts, activeTab]);

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

  if (totalComments === 0) {
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

  const activeTabInfo = CONTENT_TYPE_TABS.find(t => t.key === activeTab);
  const ActiveIcon = activeTabInfo?.icon || MessageCircle;

  return (
    <Card className="border-bone bg-cream overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-bone bg-parchment">
        <div className="flex overflow-x-auto">
          {CONTENT_TYPE_TABS.map((tab) => {
            const count = commentCounts[tab.key] || 0;
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                disabled={count === 0}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? `${tab.color} border-current`
                    : count > 0
                    ? "text-stone border-transparent hover:text-granite hover:border-bone"
                    : "text-stone/40 border-transparent cursor-not-allowed"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? tab.bgColor : "bg-bone"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comments List */}
      <CardContent className="p-4">
        <div className="space-y-3">
          {filteredComments.length === 0 ? (
            <p className="text-center text-stone py-8 italic">
              No comments in {activeTabInfo?.label || "this category"}.
            </p>
          ) : (
            filteredComments.map((comment) => (
              <div 
                key={comment.id} 
                className="p-4 rounded-lg bg-parchment border border-bone hover:border-granite/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <Link 
                    href={comment.content_url || "#"}
                    className="text-sm font-medium text-granite hover:text-copper transition-colors line-clamp-1 flex-1"
                  >
                    {comment.content_title}
                  </Link>
                  <span className="text-xs text-silver flex-shrink-0">
                    {formatDate(comment.created_at)}
                  </span>
                </div>

                <p className="text-stone text-sm whitespace-pre-wrap line-clamp-3 mb-2">
                  {comment.body}
                </p>

                {comment.content_url && comment.content_url !== "#" && (
                  <Link 
                    href={comment.content_url}
                    className="inline-flex items-center gap-1 text-xs text-copper hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View {activeTabInfo?.label.slice(0, -1) || "content"}
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

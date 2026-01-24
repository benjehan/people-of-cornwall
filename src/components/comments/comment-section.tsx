"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, Loader2, Heart, Trash2, Flag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import Link from "next/link";

interface Comment {
  id: string;
  body: string;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  like_count: number;
  user_has_liked: boolean;
}

interface CommentSectionProps {
  contentType: "story" | "event" | "lost_cornwall" | "where_is_this";
  contentId: string;
  title?: string;
}

export function CommentSection({ contentType, contentId, title = "Comments" }: CommentSectionProps) {
  const { user, profile } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likingId, setLikingId] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data: commentsData, error } = await (supabase
      .from("comments") as any)
      .select(`
        id,
        body,
        created_at,
        user:users!user_id (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .eq("is_approved", true)
      .eq("is_flagged", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading comments:", error);
      setIsLoading(false);
      return;
    }

    // Get like counts and user likes
    const commentsWithLikes = await Promise.all(
      (commentsData || []).map(async (comment: any) => {
        const { count } = await (supabase
          .from("likes") as any)
          .select("*", { count: "exact", head: true })
          .eq("content_type", "comment")
          .eq("content_id", comment.id);

        let userHasLiked = false;
        if (user) {
          const { data: like } = await (supabase
            .from("likes") as any)
            .select("id")
            .eq("content_type", "comment")
            .eq("content_id", comment.id)
            .eq("user_id", user.id)
            .single();
          userHasLiked = !!like;
        }

        return {
          ...comment,
          like_count: count || 0,
          user_has_liked: userHasLiked,
        };
      })
    );

    setComments(commentsWithLikes);
    setIsLoading(false);
  }, [contentType, contentId, user]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async () => {
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    const supabase = createClient();

    // Run moderation check
    try {
      await fetch("/api/moderation/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "comment",
          content: { text: newComment.trim() },
          submitterId: user.id,
          submitterEmail: user.email,
        }),
      });
    } catch (err) {
      console.error("Moderation check failed:", err);
    }

    const { error } = await (supabase
      .from("comments") as any)
      .insert({
        content_type: contentType,
        content_id: contentId,
        user_id: user.id,
        body: newComment.trim(),
      });

    if (error) {
      console.error("Error submitting comment:", error);
    } else {
      setNewComment("");
      await loadComments();
    }
    setIsSubmitting(false);
  };

  const handleLike = async (commentId: string, hasLiked: boolean) => {
    if (!user) return;
    
    setLikingId(commentId);
    const supabase = createClient();

    if (hasLiked) {
      await (supabase
        .from("likes") as any)
        .delete()
        .eq("content_type", "comment")
        .eq("content_id", commentId)
        .eq("user_id", user.id);
    } else {
      await (supabase
        .from("likes") as any)
        .insert({
          content_type: "comment",
          content_id: commentId,
          user_id: user.id,
        });
    }

    await loadComments();
    setLikingId(null);
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;
    if (!confirm("Delete this comment?")) return;

    const supabase = createClient();
    await (supabase
      .from("comments") as any)
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    await loadComments();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-lg font-bold text-granite flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        {title} ({comments.length})
      </h3>

      {/* Comment form */}
      {user ? (
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-granite text-parchment">
              {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="border-bone bg-parchment min-h-[80px] resize-none"
              maxLength={1000}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone">{newComment.length}/1000</span>
              <Button
                onClick={handleSubmit}
                disabled={!newComment.trim() || isSubmitting}
                className="bg-granite text-parchment hover:bg-slate"
                size="sm"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card className="border-bone bg-cream">
          <CardContent className="py-4 text-center">
            <p className="text-stone text-sm mb-2">Login to join the conversation</p>
            <Link href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`}>
              <Button size="sm" className="bg-granite text-parchment hover:bg-slate">
                Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-granite" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-stone text-sm text-center py-4 italic">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarImage src={comment.user?.avatar_url || undefined} />
                <AvatarFallback className="bg-stone text-parchment text-sm">
                  {comment.user?.display_name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-granite text-sm">
                    {comment.user?.display_name || "Anonymous"}
                  </span>
                  <span className="text-xs text-silver">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-stone text-sm whitespace-pre-wrap break-words">
                  {comment.body}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => handleLike(comment.id, comment.user_has_liked)}
                    disabled={!user || likingId === comment.id}
                    className={`flex items-center gap-1 text-xs ${
                      comment.user_has_liked 
                        ? "text-red-500" 
                        : "text-stone hover:text-red-500"
                    } transition-colors disabled:opacity-50`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${comment.user_has_liked ? "fill-current" : ""}`} />
                    {comment.like_count > 0 && comment.like_count}
                  </button>
                  
                  {user && user.id === comment.user?.id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="flex items-center gap-1 text-xs text-stone hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

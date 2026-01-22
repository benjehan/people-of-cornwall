"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle } from "lucide-react";
import { useUser, getDisplayName, getAvatarUrl } from "@/hooks/use-user";
import { addCommentAction } from "@/app/actions/comments";
import type { CommentWithAuthor } from "@/lib/supabase/queries";

interface CommentSectionProps {
  storyId: string;
  initialComments: CommentWithAuthor[];
}

export function CommentSection({ storyId, initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const { user, profile } = useUser();
  const router = useRouter();

  const displayName = getDisplayName(user, profile);
  const avatarUrl = getAvatarUrl(user, profile);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push(`/login?redirect=/stories/${storyId}`);
      return;
    }

    if (!newComment.trim()) return;

    const commentText = newComment.trim();
    setNewComment("");

    startTransition(async () => {
      const result = await addCommentAction(storyId, commentText);

      if (result.data) {
        setComments((prev) => [...prev, result.data]);
      }
    });
  };

  return (
    <section className="mt-12">
      <h2 className="mb-6 flex items-center gap-2 font-serif text-2xl font-semibold">
        <MessageCircle className="h-6 w-6" />
        Comments ({comments.length})
      </h2>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-atlantic-blue text-chalk-white">
                {displayName[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="mb-2 min-h-[100px] resize-none"
                disabled={isPending}
              />
              <Button
                type="submit"
                disabled={isPending || !newComment.trim()}
                className="bg-atlantic-blue text-chalk-white hover:bg-atlantic-blue-light"
              >
                {isPending ? "Posting..." : "Post comment"}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 rounded-lg border border-dashed border-chalk-white-dark p-6 text-center">
          <p className="mb-4 text-muted-foreground">
            Sign in to join the conversation
          </p>
          <Button
            onClick={() => router.push(`/login?redirect=/stories/${storyId}`)}
            className="bg-atlantic-blue text-chalk-white hover:bg-atlantic-blue-light"
          >
            Sign in to comment
          </Button>
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </section>
  );
}

function CommentItem({ comment }: { comment: CommentWithAuthor }) {
  const authorName = comment.author?.display_name || "Anonymous";
  const avatarUrl = comment.author?.avatar_url;
  const date = new Date(comment.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex gap-3">
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={avatarUrl || undefined} alt={authorName} />
        <AvatarFallback className="bg-sea-foam text-slate-grey">
          {authorName[0]?.toUpperCase() || "A"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-medium">{authorName}</span>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
        <p className="text-sm leading-relaxed text-slate-grey-light">
          {comment.body}
        </p>
      </div>
    </div>
  );
}

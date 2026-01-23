"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Heart, Reply, Image as ImageIcon, X, Trash2, AlertCircle } from "lucide-react";
import { useUser, getDisplayName, getAvatarUrl } from "@/hooks/use-user";
import { addCommentAction, toggleCommentLikeAction, deleteCommentAction } from "@/app/actions/comments";
import { createClient } from "@/lib/supabase/client";
import type { CommentWithAuthor } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

interface CommentSectionProps {
  storyId: string;
  initialComments: CommentWithAuthor[];
}

export function CommentSection({ storyId, initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useUser();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = getDisplayName(user, profile);
  const avatarUrl = getAvatarUrl(user, profile);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (): Promise<string | undefined> => {
    if (!imageFile || !user) return undefined;

    const supabase = createClient();
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `comment-${Date.now()}.${fileExt}`;
    const filePath = `comments/${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("story-media")
      .upload(filePath, imageFile);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload image");
    }

    const { data: { publicUrl } } = supabase.storage
      .from("story-media")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      router.push(`/login?redirect=/stories/${storyId}`);
      return;
    }

    if (!newComment.trim() && !imageFile) {
      setError("Please write a comment or add an image");
      return;
    }

    const commentText = newComment.trim();
    setNewComment("");

    startTransition(async () => {
      try {
        // Upload image if present
        let imageUrl: string | undefined;
        if (imageFile) {
          imageUrl = await uploadImage();
          clearImage();
        }

        const result = await addCommentAction(
          storyId, 
          commentText, 
          imageUrl, 
          parentId || replyingTo || undefined
        );

        if (result.error) {
          setError(result.error);
          return;
        }

        if (result.data) {
          // Add the new comment to the appropriate place
          if (parentId || replyingTo) {
            // Add as reply
            setComments(prev => addReplyToComments(prev, result.data!, parentId || replyingTo!));
          } else {
            // Add as top-level comment
            setComments(prev => [result.data!, ...prev]);
          }
        }

        setReplyingTo(null);
      } catch (err) {
        setError("Failed to post comment. Please try again.");
      }
    });
  };

  // Helper to add reply to nested comment structure
  const addReplyToComments = (comments: CommentWithAuthor[], newReply: CommentWithAuthor, parentId: string): CommentWithAuthor[] => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply]
        };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: addReplyToComments(comment.replies, newReply, parentId)
        };
      }
      return comment;
    });
  };

  // Count total comments including replies
  const countComments = (comments: CommentWithAuthor[]): number => {
    return comments.reduce((count, comment) => {
      return count + 1 + (comment.replies ? countComments(comment.replies) : 0);
    }, 0);
  };

  const totalComments = countComments(comments);

  return (
    <section className="mt-12">
      <h2 className="mb-6 flex items-center gap-2 font-serif text-2xl font-semibold text-granite">
        <MessageCircle className="h-6 w-6" />
        Comments ({totalComments})
      </h2>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-granite text-parchment">
                {displayName[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts, memories, or add to this story..."
                className="mb-2 min-h-[100px] resize-none border-bone focus:border-granite"
                disabled={isPending}
              />

              {/* Image Preview */}
              {imagePreview && (
                <div className="relative mb-2 inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-40 rounded-lg border border-bone"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -right-2 -top-2 rounded-full bg-granite p-1 text-parchment hover:bg-slate"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-2 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={isPending || (!newComment.trim() && !imageFile)}
                  className="bg-granite text-parchment hover:bg-slate"
                >
                  {isPending ? "Posting..." : "Post comment"}
                </Button>

                {/* Image Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-bone hover:border-granite"
                  title="Add an image"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 rounded-lg border border-dashed border-bone bg-cream/50 p-6 text-center">
          <p className="mb-4 text-stone">
            Sign in to join the conversation
          </p>
          <Button
            onClick={() => router.push(`/login?redirect=/stories/${storyId}`)}
            className="bg-granite text-parchment hover:bg-slate"
          >
            Sign in to comment
          </Button>
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              storyId={storyId}
              user={user}
              onReply={(id) => setReplyingTo(id)}
              replyingTo={replyingTo}
              onSubmitReply={handleSubmit}
              newComment={newComment}
              setNewComment={setNewComment}
              isPending={isPending}
              depth={0}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-stone">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </section>
  );
}

interface CommentItemProps {
  comment: CommentWithAuthor;
  storyId: string;
  user: any;
  onReply: (id: string) => void;
  replyingTo: string | null;
  onSubmitReply: (e: React.FormEvent, parentId: string) => void;
  newComment: string;
  setNewComment: (value: string) => void;
  isPending: boolean;
  depth: number;
}

function CommentItem({ 
  comment, 
  storyId, 
  user, 
  onReply, 
  replyingTo, 
  onSubmitReply, 
  newComment, 
  setNewComment, 
  isPending,
  depth 
}: CommentItemProps) {
  const [liked, setLiked] = useState(comment.has_liked || false);
  const [likeCount, setLikeCount] = useState(comment.like_count || 0);
  const [isLiking, startLikeTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const router = useRouter();

  const authorName = comment.author?.display_name || "Anonymous";
  const avatarUrl = comment.author?.avatar_url;
  const date = new Date(comment.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const isOwner = user?.id === comment.user_id;
  const isFlagged = comment.status === "flagged";
  const maxDepth = 3; // Limit nesting depth

  const handleLike = () => {
    if (!user) {
      router.push(`/login?redirect=/stories/${storyId}`);
      return;
    }

    startLikeTransition(async () => {
      const result = await toggleCommentLikeAction(comment.id, storyId);
      if (!result.error) {
        setLiked(result.liked);
        setLikeCount(prev => result.liked ? prev + 1 : prev - 1);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this comment? This cannot be undone.")) return;

    startDeleteTransition(async () => {
      await deleteCommentAction(comment.id, storyId);
      // The page will revalidate and remove the comment
      router.refresh();
    });
  };

  return (
    <div className={cn(
      "flex gap-3",
      depth > 0 && "ml-8 border-l-2 border-bone pl-4"
    )}>
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={avatarUrl || undefined} alt={authorName} />
        <AvatarFallback className="bg-cream text-granite">
          {authorName[0]?.toUpperCase() || "A"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="font-medium text-granite">{authorName}</span>
          <span className="text-xs text-silver">{date}</span>
          {isFlagged && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              Under review
            </span>
          )}
        </div>

        {/* Comment text */}
        <p className="text-sm leading-relaxed text-slate">
          {comment.body}
        </p>

        {/* Comment image */}
        {comment.image_url && (
          <img 
            src={comment.image_url} 
            alt="Comment image"
            className="mt-2 max-h-64 rounded-lg border border-bone"
          />
        )}

        {/* Action buttons */}
        <div className="mt-2 flex items-center gap-4">
          {/* Like button */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={cn(
              "flex items-center gap-1 text-xs transition-colors",
              liked 
                ? "text-red-500 hover:text-red-600" 
                : "text-silver hover:text-granite"
            )}
          >
            <Heart className={cn("h-4 w-4", liked && "fill-current")} />
            <span>{likeCount > 0 ? likeCount : ""}</span>
          </button>

          {/* Reply button (only show if not too deep) */}
          {user && depth < maxDepth && (
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-xs text-silver hover:text-granite transition-colors"
            >
              <Reply className="h-4 w-4" />
              Reply
            </button>
          )}

          {/* Delete button (only for owner) */}
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 text-xs text-silver hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>

        {/* Reply form */}
        {replyingTo === comment.id && user && (
          <form 
            onSubmit={(e) => onSubmitReply(e, comment.id)} 
            className="mt-3 flex gap-2"
          >
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Reply to ${authorName}...`}
              className="min-h-[80px] resize-none border-bone focus:border-granite text-sm"
              disabled={isPending}
              autoFocus
            />
            <div className="flex flex-col gap-1">
              <Button
                type="submit"
                size="sm"
                disabled={isPending || !newComment.trim()}
                className="bg-granite text-parchment hover:bg-slate"
              >
                Reply
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onReply("")}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                storyId={storyId}
                user={user}
                onReply={onReply}
                replyingTo={replyingTo}
                onSubmitReply={onSubmitReply}
                newComment={newComment}
                setNewComment={setNewComment}
                isPending={isPending}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

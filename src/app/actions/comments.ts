"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserEmail } from "@/lib/supabase/admin";
import { sendNewCommentEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import type { CommentWithAuthor } from "@/lib/supabase/queries";

interface AddCommentParams {
  storyId: string;
  body: string;
  imageUrl?: string;
  parentId?: string; // For replies
}

export async function addCommentAction(
  storyId: string, 
  body: string,
  imageUrl?: string,
  parentId?: string
) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", data: null };
  }

  if (!body.trim() && !imageUrl) {
    return { error: "Comment cannot be empty", data: null };
  }

  // AI Moderation check
  let moderationScore = 0;
  let moderationFlags: string[] = [];
  
  try {
    const moderationResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/ai/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: body }),
    });

    if (moderationResponse.ok) {
      const moderation = await moderationResponse.json();
      moderationScore = moderation.score;
      moderationFlags = moderation.flags;

      // Block clearly harmful content
      if (!moderation.approved) {
        return { 
          error: "Your comment contains content that violates our community guidelines. Please revise and try again.", 
          data: null 
        };
      }
    }
  } catch (error) {
    console.error("Moderation check failed:", error);
    // Continue without moderation if it fails
  }

  // Get commenter's profile
  const { data: commenterProfile } = await (supabase
    .from("users") as any)
    .select("display_name")
    .eq("id", user.id)
    .single();

  // Get story details for notification
  const { data: story } = await (supabase
    .from("stories") as any)
    .select("id, title, author_id, author_display_name")
    .eq("id", storyId)
    .single();

  // Get parent comment author if this is a reply
  let parentAuthorId: string | null = null;
  if (parentId) {
    const { data: parentComment } = await (supabase
      .from("comments") as any)
      .select("user_id")
      .eq("id", parentId)
      .single();
    parentAuthorId = parentComment?.user_id;
  }

  // Insert comment with moderation data
  const insertData: any = {
    story_id: storyId,
    user_id: user.id,
    body: body.trim(),
    moderation_score: moderationScore,
    moderation_flags: moderationFlags.length > 0 ? moderationFlags : null,
  };

  if (imageUrl) {
    insertData.image_url = imageUrl;
  }

  if (parentId) {
    insertData.parent_id = parentId;
  }

  // Auto-flag borderline content for review but still post it
  if (moderationScore > 0.3) {
    insertData.status = 'flagged';
  }

  const { data, error } = await (supabase
    .from("comments") as any)
    .insert(insertData)
    .select(`
      *,
      author:users(id, display_name, avatar_url)
    `)
    .single();

  if (error) {
    console.error("Error adding comment:", error);
    return { error: error.message, data: null };
  }

  // Send email notification to story author (non-blocking)
  // Don't notify if the author is commenting on their own story
  if (story?.author_id && story.author_id !== user.id) {
    getUserEmail(story.author_id).then((email) => {
      if (email) {
        sendNewCommentEmail({
          to: email,
          authorName: story.author_display_name || "Contributor",
          storyTitle: story.title,
          storyId: story.id,
          commenterName: commenterProfile?.display_name || user.user_metadata?.full_name || "Someone",
          commentPreview: body.trim().slice(0, 200) + (body.length > 200 ? "..." : ""),
        }).catch(console.error);
      }
    });
  }

  // If this is a reply, also notify the parent comment author
  if (parentAuthorId && parentAuthorId !== user.id && parentAuthorId !== story?.author_id) {
    getUserEmail(parentAuthorId).then((email) => {
      if (email && story) {
        sendNewCommentEmail({
          to: email,
          authorName: "Someone replied to your comment",
          storyTitle: story.title,
          storyId: story.id,
          commenterName: commenterProfile?.display_name || user.user_metadata?.full_name || "Someone",
          commentPreview: body.trim().slice(0, 200) + (body.length > 200 ? "..." : ""),
        }).catch(console.error);
      }
    });
  }

  revalidatePath(`/stories/${storyId}`);
  return { data: data as CommentWithAuthor, error: null };
}

// Like/unlike a comment
export async function toggleCommentLikeAction(commentId: string, storyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", liked: false };
  }

  // Check if already liked
  const { data: existingLike } = await (supabase
    .from("comment_likes") as any)
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .single();

  if (existingLike) {
    // Unlike
    await (supabase
      .from("comment_likes") as any)
      .delete()
      .eq("id", existingLike.id);
    
    revalidatePath(`/stories/${storyId}`);
    return { error: null, liked: false };
  } else {
    // Like
    const { error } = await (supabase
      .from("comment_likes") as any)
      .insert({
        comment_id: commentId,
        user_id: user.id,
      });

    if (error) {
      console.error("Error liking comment:", error);
      return { error: error.message, liked: false };
    }

    revalidatePath(`/stories/${storyId}`);
    return { error: null, liked: true };
  }
}

// Delete a comment
export async function deleteCommentAction(commentId: string, storyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await (supabase
    .from("comments") as any)
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting comment:", error);
    return { error: error.message };
  }

  revalidatePath(`/stories/${storyId}`);
  return { error: null };
}

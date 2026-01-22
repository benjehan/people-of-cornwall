"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserEmail } from "@/lib/supabase/admin";
import { sendNewCommentEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import type { CommentWithAuthor } from "@/lib/supabase/queries";

export async function addCommentAction(storyId: string, body: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", data: null };
  }

  if (!body.trim()) {
    return { error: "Comment cannot be empty", data: null };
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

  // Insert comment
  const { data, error } = await (supabase
    .from("comments") as any)
    .insert({
      story_id: storyId,
      user_id: user.id,
      body: body.trim(),
    })
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

  revalidatePath(`/stories/${storyId}`);
  return { data: data as CommentWithAuthor, error: null };
}

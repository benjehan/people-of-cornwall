"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CommentWithAuthor } from "@/lib/supabase/queries";
import type { TablesInsert } from "@/types/supabase";

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

  // Insert comment
  const commentData: TablesInsert<"comments"> = {
    story_id: storyId,
    user_id: user.id,
    body: body.trim(),
  };

  const { data, error } = await supabase
    .from("comments")
    .insert(commentData)
    .select(`
      *,
      author:users(id, display_name, avatar_url)
    `)
    .single();

  if (error) {
    console.error("Error adding comment:", error);
    return { error: error.message, data: null };
  }

  revalidatePath(`/stories/${storyId}`);
  return { data: data as CommentWithAuthor, error: null };
}

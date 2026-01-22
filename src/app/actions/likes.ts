"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TablesInsert } from "@/types/supabase";

export async function toggleLikeAction(storyId: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("story_id", storyId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Unlike
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("id", existing.id);

    if (error) {
      console.error("Error removing like:", error);
      return { error: error.message, liked: true };
    }

    revalidatePath(`/stories/${storyId}`);
    return { liked: false, error: null };
  } else {
    // Like
    const likeData: TablesInsert<"likes"> = {
      story_id: storyId,
      user_id: user.id,
    };

    const { error } = await supabase
      .from("likes")
      .insert(likeData);

    if (error) {
      console.error("Error adding like:", error);
      return { error: error.message, liked: false };
    }

    revalidatePath(`/stories/${storyId}`);
    return { liked: true, error: null };
  }
}

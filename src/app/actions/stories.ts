"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

interface SaveStoryData {
  id?: string;
  title: string;
  body?: string;
  location_name?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  timeline_year?: number | null;
  anonymous?: boolean;
}

/**
 * Save a story draft
 */
export async function saveStoryAction(data: SaveStoryData) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", data: null };
  }

  if (data.id) {
    // Update existing story
    const updateData: TablesUpdate<"stories"> = {
      title: data.title,
      body: data.body,
      location_name: data.location_name,
      location_lat: data.location_lat,
      location_lng: data.location_lng,
      timeline_year: data.timeline_year,
      anonymous: data.anonymous,
    };

    const { data: story, error } = await supabase
      .from("stories")
      .update(updateData)
      .eq("id", data.id)
      .eq("author_id", user.id) // Security: only update own stories
      .select()
      .single();

    if (error) {
      console.error("Error updating story:", error);
      return { error: error.message, data: null };
    }

    revalidatePath("/profile/stories");
    return { data: story, error: null };
  } else {
    // Create new story
    const insertData: TablesInsert<"stories"> = {
      title: data.title,
      body: data.body,
      author_id: user.id,
      location_name: data.location_name,
      location_lat: data.location_lat,
      location_lng: data.location_lng,
      timeline_year: data.timeline_year,
      anonymous: data.anonymous,
      status: "draft",
    };

    const { data: story, error } = await supabase
      .from("stories")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating story:", error);
      return { error: error.message, data: null };
    }

    revalidatePath("/profile/stories");
    return { data: story, error: null };
  }
}

/**
 * Submit a story for review
 */
export async function submitStoryAction(storyId: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Update story status to review
  const updateData: TablesUpdate<"stories"> = { status: "review" };

  const { error } = await supabase
    .from("stories")
    .update(updateData)
    .eq("id", storyId)
    .eq("author_id", user.id) // Security: only submit own stories
    .in("status", ["draft", "rejected"]); // Can only submit drafts or rejected stories

  if (error) {
    console.error("Error submitting story:", error);
    return { error: error.message };
  }

  revalidatePath("/profile/stories");
  return { error: null };
}

/**
 * Unpublish a story (to edit it)
 */
export async function unpublishStoryAction(storyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const updateData: TablesUpdate<"stories"> = { status: "unpublished" };

  const { error } = await supabase
    .from("stories")
    .update(updateData)
    .eq("id", storyId)
    .eq("author_id", user.id)
    .eq("status", "published");

  if (error) {
    console.error("Error unpublishing story:", error);
    return { error: error.message };
  }

  revalidatePath("/profile/stories");
  revalidatePath(`/stories/${storyId}`);
  return { error: null };
}

/**
 * Delete a story (soft delete) - for drafts only
 */
export async function deleteStoryAction(storyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Can only directly delete drafts
  const updateData: TablesUpdate<"stories"> = { soft_deleted: true };

  const { error } = await supabase
    .from("stories")
    .update(updateData)
    .eq("id", storyId)
    .eq("author_id", user.id)
    .eq("status", "draft");

  if (error) {
    console.error("Error deleting story:", error);
    return { error: error.message };
  }

  revalidatePath("/profile/stories");
  return { error: null };
}

/**
 * Request deletion of a story (for non-draft stories)
 * Admin will review and approve/reject
 */
export async function requestDeletionAction(storyId: string, reason?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const updateData: TablesUpdate<"stories"> = {
    deletion_requested: true,
    deletion_requested_at: new Date().toISOString(),
    deletion_reason: reason || null,
  };

  const { error } = await supabase
    .from("stories")
    .update(updateData)
    .eq("id", storyId)
    .eq("author_id", user.id)
    .eq("soft_deleted", false);

  if (error) {
    console.error("Error requesting deletion:", error);
    return { error: error.message };
  }

  revalidatePath("/profile/stories");
  return { error: null };
}

/**
 * Cancel a deletion request (author only)
 */
export async function cancelDeletionRequestAction(storyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const updateData: TablesUpdate<"stories"> = {
    deletion_requested: false,
    deletion_requested_at: null,
    deletion_reason: null,
  };

  const { error } = await supabase
    .from("stories")
    .update(updateData)
    .eq("id", storyId)
    .eq("author_id", user.id);

  if (error) {
    console.error("Error canceling deletion request:", error);
    return { error: error.message };
  }

  revalidatePath("/profile/stories");
  return { error: null };
}

/**
 * Approve deletion request (admin only)
 */
export async function approveDeletionAction(storyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if admin
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized - Admin only" };
  }

  // Soft delete the story
  const updateData: TablesUpdate<"stories"> = {
    soft_deleted: true,
    deletion_requested: false,
  };

  const { error } = await supabase
    .from("stories")
    .update(updateData)
    .eq("id", storyId);

  if (error) {
    console.error("Error approving deletion:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/deletions");
  revalidatePath("/profile/stories");
  return { error: null };
}

/**
 * Reject deletion request (admin only)
 */
export async function rejectDeletionAction(storyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if admin
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized - Admin only" };
  }

  // Clear the deletion request
  const updateData: TablesUpdate<"stories"> = {
    deletion_requested: false,
    deletion_requested_at: null,
    deletion_reason: null,
  };

  const { error } = await supabase
    .from("stories")
    .update(updateData)
    .eq("id", storyId);

  if (error) {
    console.error("Error rejecting deletion:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/deletions");
  return { error: null };
}

/**
 * Admin force delete any story
 */
export async function adminDeleteStoryAction(storyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if admin
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized - Admin only" };
  }

  // Soft delete the story
  const updateData: TablesUpdate<"stories"> = { soft_deleted: true };

  const { error } = await supabase
    .from("stories")
    .update(updateData)
    .eq("id", storyId);

  if (error) {
    console.error("Error deleting story:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/stories");
  revalidatePath("/admin/deletions");
  return { error: null };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyAdminsOfNewStory } from "@/lib/email";

interface SaveStoryData {
  id?: string;
  title: string;
  body?: string;
  location_name?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  timeline_year?: number | null;
  anonymous?: boolean;
  prompt_id?: string | null;
  ambient_sound?: string | null;
  voice_preference?: "male" | "female";
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
    const { data: story, error } = await (supabase
      .from("stories") as any)
      .update({
        title: data.title,
        body: data.body,
        location_name: data.location_name,
        location_lat: data.location_lat,
        location_lng: data.location_lng,
        timeline_year: data.timeline_year,
        anonymous: data.anonymous,
        prompt_id: data.prompt_id,
        ambient_sound: data.ambient_sound,
        voice_preference: data.voice_preference || "male",
      })
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
    const { data: story, error } = await (supabase
      .from("stories") as any)
      .insert({
        title: data.title,
        body: data.body,
        author_id: user.id,
        location_name: data.location_name,
        location_lat: data.location_lat,
        location_lng: data.location_lng,
        timeline_year: data.timeline_year,
        anonymous: data.anonymous,
        prompt_id: data.prompt_id,
        ambient_sound: data.ambient_sound,
        voice_preference: data.voice_preference || "male",
        status: "draft",
      })
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
 * Submit a story for review (works for drafts, rejected, published, and unpublished)
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

  // Get story details for email notification and moderation
  const { data: story } = await (supabase
    .from("stories") as any)
    .select("title, author_display_name, body")
    .eq("id", storyId)
    .single();

  // Run AI moderation on the story content (FREE!)
  let moderationScore = 0;
  let moderationFlags: string[] = [];
  
  if (story?.body) {
    try {
      // Strip HTML for moderation
      const plainText = story.body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      const textToCheck = `${story.title || ""}\n\n${plainText}`;
      
      // Use OpenAI Moderation API (FREE)
      const moderationResponse = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ input: textToCheck }),
      });

      if (moderationResponse.ok) {
        const moderationData = await moderationResponse.json();
        const result = moderationData.results?.[0];
        
        if (result) {
          const categories = result.categories || {};
          const scores = result.category_scores || {};
          
          // Map categories to human-readable flags
          const categoryMap: Record<string, string> = {
            "hate": "hate_speech",
            "hate/threatening": "hate_threatening",
            "harassment": "harassment",
            "harassment/threatening": "harassment_threatening",
            "self-harm": "self_harm",
            "sexual": "sexual_content",
            "violence": "violence",
          };
          
          for (const [category, detected] of Object.entries(categories)) {
            if (detected) {
              const flag = categoryMap[category] || category.replace(/[\/\s]/g, "_");
              moderationFlags.push(flag);
            }
          }
          
          moderationScore = Math.max(...Object.values(scores as Record<string, number>), 0);
        }
      }
    } catch (err) {
      console.error("Moderation check failed:", err);
      // Continue without moderation if it fails
    }
  }

  // Update story status to review
  // Authors can submit/resubmit from: draft, rejected, published (edit), unpublished
  const { error } = await (supabase
    .from("stories") as any)
    .update({ 
      status: "review",
      // Clear any rejection reason when resubmitting
      rejection_reason: null,
    })
    .eq("id", storyId)
    .eq("author_id", user.id) // Security: only submit own stories
    .in("status", ["draft", "rejected", "published", "unpublished"]);

  if (error) {
    console.error("Error submitting story:", error);
    return { error: error.message };
  }

  // Send admin notification email with moderation results (non-blocking)
  if (story) {
    notifyAdminsOfNewStory({
      storyTitle: story.title || "Untitled",
      authorName: story.author_display_name || user.user_metadata?.full_name || "Anonymous",
      storyId,
      moderationScore,
      moderationFlags,
    }).catch(console.error);
  }

  revalidatePath("/profile/stories");
  revalidatePath(`/stories/${storyId}`);
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

  const { error } = await (supabase
    .from("stories") as any)
    .update({ status: "unpublished" })
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
  const { error } = await (supabase
    .from("stories") as any)
    .update({ soft_deleted: true })
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

  const { error } = await (supabase
    .from("stories") as any)
    .update({
      deletion_requested: true,
      deletion_requested_at: new Date().toISOString(),
      deletion_reason: reason || null,
    })
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

  const { error } = await (supabase
    .from("stories") as any)
    .update({
      deletion_requested: false,
      deletion_requested_at: null,
      deletion_reason: null,
    })
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
  const { data: profile } = await (supabase
    .from("users") as any)
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized - Admin only" };
  }

  // Soft delete the story
  const { error } = await (supabase
    .from("stories") as any)
    .update({
      soft_deleted: true,
      deletion_requested: false,
    })
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
  const { data: profile } = await (supabase
    .from("users") as any)
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized - Admin only" };
  }

  // Clear the deletion request
  const { error } = await (supabase
    .from("stories") as any)
    .update({
      deletion_requested: false,
      deletion_requested_at: null,
      deletion_reason: null,
    })
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
  const { data: profile } = await (supabase
    .from("users") as any)
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized - Admin only" };
  }

  // Soft delete the story
  const { error } = await (supabase
    .from("stories") as any)
    .update({ soft_deleted: true })
    .eq("id", storyId);

  if (error) {
    console.error("Error deleting story:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/stories");
  revalidatePath("/admin/deletions");
  return { error: null };
}

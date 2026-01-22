/**
 * Supabase Query Functions
 * 
 * All database queries for stories, comments, likes, etc.
 */

import { createClient } from "./server";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

// =============================================================================
// STORIES
// =============================================================================

export type StoryWithCounts = Tables<"stories"> & {
  likes_count: number;
  comments_count: number;
};

/**
 * Get published stories with pagination
 */
export async function getPublishedStories({
  page = 1,
  perPage = 12,
  decade,
  location,
  tag,
  search,
}: {
  page?: number;
  perPage?: number;
  decade?: number;
  location?: string;
  tag?: string;
  search?: string;
} = {}) {
  const supabase = await createClient();
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = (supabase
    .from("stories") as any)
    .select("*, likes(count), comments(count)", { count: "exact" })
    .eq("status", "published")
    .eq("soft_deleted", false)
    .order("published_at", { ascending: false })
    .range(from, to);

  if (decade) {
    query = query.eq("timeline_decade", decade);
  }

  if (location) {
    query = query.ilike("location_name", `%${location}%`);
  }

  if (tag) {
    query = query.contains("ai_tags", [tag]);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching stories:", error);
    return { stories: [], count: 0, error };
  }

  // Transform the count aggregates
  const stories: StoryWithCounts[] = (data || []).map((story: any) => ({
    ...story,
    likes_count: Array.isArray(story.likes) ? story.likes[0]?.count || 0 : 0,
    comments_count: Array.isArray(story.comments) ? story.comments[0]?.count || 0 : 0,
  }));

  return { stories, count: count || 0, error: null };
}

/**
 * Get featured story
 */
export async function getFeaturedStory() {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from("stories") as any)
    .select("*, likes(count), comments(count)")
    .eq("status", "published")
    .eq("soft_deleted", false)
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching featured story:", error);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    likes_count: Array.isArray(data.likes) ? data.likes[0]?.count || 0 : 0,
    comments_count: Array.isArray(data.comments) ? data.comments[0]?.count || 0 : 0,
  } as StoryWithCounts;
}

/**
 * Get a single story by ID
 */
export async function getStoryById(id: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from("stories") as any)
    .select("*, likes(count), comments(count)")
    .eq("id", id)
    .eq("soft_deleted", false)
    .single();

  if (error) {
    console.error("Error fetching story:", error);
    return null;
  }

  return {
    ...data,
    likes_count: Array.isArray(data.likes) ? data.likes[0]?.count || 0 : 0,
    comments_count: Array.isArray(data.comments) ? data.comments[0]?.count || 0 : 0,
  } as StoryWithCounts;
}

/**
 * Get stories by user
 */
export async function getUserStories(userId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from("stories") as any)
    .select("*, likes(count), comments(count)")
    .eq("author_id", userId)
    .eq("soft_deleted", false)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching user stories:", error);
    return [];
  }

  return (data || []).map((story: any) => ({
    ...story,
    likes_count: Array.isArray(story.likes) ? story.likes[0]?.count || 0 : 0,
    comments_count: Array.isArray(story.comments) ? story.comments[0]?.count || 0 : 0,
  })) as StoryWithCounts[];
}

/**
 * Create a new story draft
 */
export async function createStory(story: TablesInsert<"stories">) {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from("stories") as any)
    .insert(story)
    .select()
    .single();

  if (error) {
    console.error("Error creating story:", error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update a story
 */
export async function updateStory(id: string, updates: TablesUpdate<"stories">) {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from("stories") as any)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating story:", error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get unique locations for filter
 */
export async function getStoryLocations() {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from("stories") as any)
    .select("location_name")
    .eq("status", "published")
    .eq("soft_deleted", false)
    .not("location_name", "is", null)
    .order("location_name");

  if (error) {
    console.error("Error fetching locations:", error);
    return [];
  }

  // Get unique locations
  const locations = [...new Set(data?.map((s: any) => s.location_name).filter(Boolean))];
  return locations as string[];
}

/**
 * Get unique decades for filter
 */
export async function getStoryDecades() {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from("stories") as any)
    .select("timeline_decade")
    .eq("status", "published")
    .eq("soft_deleted", false)
    .not("timeline_decade", "is", null)
    .order("timeline_decade");

  if (error) {
    console.error("Error fetching decades:", error);
    return [];
  }

  // Get unique decades
  const decades = [...new Set(data?.map((s: any) => s.timeline_decade).filter(Boolean))];
  return decades as number[];
}

// =============================================================================
// COMMENTS
// =============================================================================

export type CommentWithAuthor = Tables<"comments"> & {
  author: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

/**
 * Get comments for a story
 */
export async function getStoryComments(storyId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from("comments") as any)
    .select(`
      *,
      author:users(id, display_name, avatar_url)
    `)
    .eq("story_id", storyId)
    .eq("status", "visible")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    return [];
  }

  return (data || []) as CommentWithAuthor[];
}

/**
 * Create a comment
 */
export async function createComment(comment: TablesInsert<"comments">) {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from("comments") as any)
    .insert(comment)
    .select(`
      *,
      author:users(id, display_name, avatar_url)
    `)
    .single();

  if (error) {
    console.error("Error creating comment:", error);
    return { data: null, error };
  }

  return { data: data as CommentWithAuthor, error: null };
}

// =============================================================================
// LIKES
// =============================================================================

/**
 * Check if user has liked a story
 */
export async function hasUserLikedStory(storyId: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from("likes") as any)
    .select("id")
    .eq("story_id", storyId)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking like:", error);
  }

  return !!data;
}

/**
 * Toggle like on a story
 */
export async function toggleLike(storyId: string, userId: string) {
  const supabase = await createClient();

  // Check if already liked
  const { data: existing } = await (supabase
    .from("likes") as any)
    .select("id")
    .eq("story_id", storyId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    // Unlike
    const { error } = await (supabase
      .from("likes") as any)
      .delete()
      .eq("id", existing.id);

    if (error) {
      console.error("Error removing like:", error);
      return { liked: true, error };
    }

    return { liked: false, error: null };
  } else {
    // Like
    const { error } = await (supabase
      .from("likes") as any)
      .insert({ story_id: storyId, user_id: userId });

    if (error) {
      console.error("Error adding like:", error);
      return { liked: false, error };
    }

    return { liked: true, error: null };
  }
}

// =============================================================================
// COLLECTIONS
// =============================================================================

export type CollectionWithCount = Tables<"collections"> & {
  story_count: number;
};

/**
 * Get all collections
 */
export async function getCollections() {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from("collections") as any)
    .select("*, story_collections(count)")
    .order("title");

  if (error) {
    console.error("Error fetching collections:", error);
    return [];
  }

  return (data || []).map((collection: any) => ({
    ...collection,
    story_count: Array.isArray(collection.story_collections)
      ? collection.story_collections[0]?.count || 0
      : 0,
  })) as CollectionWithCount[];
}

/**
 * Get stories in a collection
 */
export async function getCollectionStories(collectionSlug: string) {
  const supabase = await createClient();

  const { data: collection } = await (supabase
    .from("collections") as any)
    .select("id, title, description")
    .eq("slug", collectionSlug)
    .single();

  if (!collection) return { collection: null, stories: [] };

  const { data: storyLinks } = await (supabase
    .from("story_collections") as any)
    .select("story_id")
    .eq("collection_id", collection.id);

  if (!storyLinks?.length) return { collection, stories: [] };

  const storyIds = storyLinks.map((l: any) => l.story_id);

  const { data: stories } = await (supabase
    .from("stories") as any)
    .select("*, likes(count), comments(count)")
    .in("id", storyIds)
    .eq("status", "published")
    .eq("soft_deleted", false);

  const storiesWithCounts = (stories || []).map((story: any) => ({
    ...story,
    likes_count: Array.isArray(story.likes) ? story.likes[0]?.count || 0 : 0,
    comments_count: Array.isArray(story.comments) ? story.comments[0]?.count || 0 : 0,
  })) as StoryWithCounts[];

  return { collection, stories: storiesWithCounts };
}

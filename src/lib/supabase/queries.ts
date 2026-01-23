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
  first_image_url?: string | null;
};

/**
 * Extract first image URL from story body HTML
 */
function extractFirstImage(body: string | null): string | null {
  if (!body) return null;
  const imgMatch = body.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : null;
}

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

  // Transform the count aggregates and extract first image
  const stories: StoryWithCounts[] = (data || []).map((story: any) => ({
    ...story,
    likes_count: Array.isArray(story.likes) ? story.likes[0]?.count || 0 : 0,
    comments_count: Array.isArray(story.comments) ? story.comments[0]?.count || 0 : 0,
    first_image_url: extractFirstImage(story.body),
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
    first_image_url: extractFirstImage(data.body),
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
    first_image_url: extractFirstImage(data.body),
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
    first_image_url: extractFirstImage(story.body),
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
 * Get stories with locations for the map (includes first image)
 */
export async function getStoriesForMap() {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from("stories") as any)
    .select(`
      id, title, body, author_display_name, anonymous, 
      location_name, location_lat, location_lng, 
      timeline_decade, ai_summary,
      likes(count), comments(count),
      media(url, type)
    `)
    .eq("status", "published")
    .eq("soft_deleted", false)
    .not("location_lat", "is", null)
    .not("location_lng", "is", null)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching stories for map:", error);
    return [];
  }

  // Transform and get first image
  return (data || []).map((story: any) => {
    // Try to get first image from media table
    let firstImage = null;
    if (story.media && Array.isArray(story.media)) {
      const imageMedia = story.media.find((m: any) => m.type === "image");
      if (imageMedia) {
        firstImage = imageMedia.url;
      }
    }
    
    // If no media, try to extract first image from body HTML
    if (!firstImage && story.body) {
      const imgMatch = story.body.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) {
        firstImage = imgMatch[1];
      }
    }

    return {
      ...story,
      likes_count: Array.isArray(story.likes) ? story.likes[0]?.count || 0 : 0,
      comments_count: Array.isArray(story.comments) ? story.comments[0]?.count || 0 : 0,
      first_image_url: firstImage,
    };
  });
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

/**
 * Get related stories based on tags, location, or decade
 */
export async function getRelatedStories(
  storyId: string, 
  tags: string[] | null, 
  locationName: string | null, 
  decade: number | null, 
  limit = 3
): Promise<StoryWithCounts[]> {
  const supabase = await createClient();
  
  let query = (supabase
    .from("stories") as any)
    .select("*, likes(count), comments(count)")
    .eq("status", "published")
    .eq("soft_deleted", false)
    .neq("id", storyId)
    .limit(limit);

  // Try to match by tags first, then location, then decade
  if (tags && tags.length > 0) {
    query = query.overlaps("ai_tags", tags);
  } else if (locationName) {
    query = query.ilike("location_name", `%${locationName}%`);
  } else if (decade) {
    query = query.eq("timeline_decade", decade);
  }

  const { data } = await query.order("published_at", { ascending: false });

  if (!data || data.length === 0) {
    // Fallback: just get recent stories
    const { data: fallbackData } = await (supabase
      .from("stories") as any)
      .select("*, likes(count), comments(count)")
      .eq("status", "published")
      .eq("soft_deleted", false)
      .neq("id", storyId)
      .order("published_at", { ascending: false })
      .limit(limit);
    
    return (fallbackData || []).map((story: any) => ({
      ...story,
      likes_count: Array.isArray(story.likes) ? story.likes[0]?.count || 0 : 0,
      comments_count: Array.isArray(story.comments) ? story.comments[0]?.count || 0 : 0,
      first_image_url: extractFirstImage(story.body),
    })) as StoryWithCounts[];
  }

  return (data || []).map((story: any) => ({
    ...story,
    likes_count: Array.isArray(story.likes) ? story.likes[0]?.count || 0 : 0,
    comments_count: Array.isArray(story.comments) ? story.comments[0]?.count || 0 : 0,
    first_image_url: extractFirstImage(story.body),
  })) as StoryWithCounts[];
}

/**
 * Get featured collections for homepage
 */
export async function getFeaturedCollections(limit = 3) {
  const supabase = await createClient();
  
  const { data } = await (supabase
    .from("collections") as any)
    .select("*, story_collections(count)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    story_count: Array.isArray(c.story_collections)
      ? c.story_collections[0]?.count || 0
      : 0,
  }));
}

// =============================================================================
// COMMENTS
// =============================================================================

export type CommentWithAuthor = {
  id: string;
  story_id: string;
  user_id: string;
  body: string;
  status: string;
  created_at: string;
  parent_id: string | null;
  image_url: string | null;
  like_count: number;
  moderation_score: number | null;
  moderation_flags: string[] | null;
  author: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  has_liked?: boolean;
  replies?: CommentWithAuthor[];
};

/**
 * Get comments for a story (with likes and replies)
 * Sorted by most liked first, then by date
 */
export async function getStoryComments(storyId: string, userId?: string) {
  const supabase = await createClient();

  // Fetch all comments for the story (visible and flagged - admins see flagged in admin panel)
  const { data, error } = await (supabase
    .from("comments") as any)
    .select(`
      *,
      author:users(id, display_name, avatar_url)
    `)
    .eq("story_id", storyId)
    .in("status", ["visible", "flagged"])
    .order("like_count", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    return [];
  }

  // If user is logged in, check which comments they've liked
  let userLikes: Set<string> = new Set();
  if (userId) {
    const { data: likes } = await (supabase
      .from("comment_likes") as any)
      .select("comment_id")
      .eq("user_id", userId);
    
    if (likes) {
      userLikes = new Set(likes.map((l: any) => l.comment_id));
    }
  }

  // Add has_liked to each comment
  const commentsWithLikes = (data || []).map((comment: any) => ({
    ...comment,
    has_liked: userLikes.has(comment.id),
    like_count: comment.like_count || 0,
  }));

  // Organize into threaded structure
  const commentMap = new Map<string, CommentWithAuthor>();
  const rootComments: CommentWithAuthor[] = [];

  // First pass: create map
  commentsWithLikes.forEach((comment: CommentWithAuthor) => {
    comment.replies = [];
    commentMap.set(comment.id, comment);
  });

  // Second pass: organize into threads
  commentsWithLikes.forEach((comment: CommentWithAuthor) => {
    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      const parent = commentMap.get(comment.parent_id);
      parent?.replies?.push(comment);
    } else {
      rootComments.push(comment);
    }
  });

  // Sort root comments by likes (most liked first)
  rootComments.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));

  return rootComments;
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

// =============================================================================
// PROMPTS
// =============================================================================

export interface Prompt {
  id: string;
  title: string;
  body: string;
  active: boolean;
  featured: boolean;
  created_at: string;
  expires_at: string | null;
  story_count: number;
}

/**
 * Get active prompts
 */
export async function getActivePrompts() {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from("prompts") as any)
    .select("*, stories(count)")
    .eq("active", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching prompts:", error);
    return [];
  }

  // Compute story_count from the stories relationship
  return (data || []).map((prompt: any) => ({
    ...prompt,
    story_count: Array.isArray(prompt.stories) ? prompt.stories[0]?.count || 0 : 0,
  })) as Prompt[];
}

/**
 * Get featured prompt
 */
export async function getFeaturedPrompt() {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from("prompts") as any)
    .select("*, stories(count)")
    .eq("active", true)
    .eq("featured", true)
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching featured prompt:", error);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    story_count: Array.isArray(data.stories) ? data.stories[0]?.count || 0 : 0,
  } as Prompt;
}

/**
 * Get all prompts for homepage carousel (shuffled)
 */
export async function getRotatingPrompts() {
  const supabase = await createClient();

  // Get all active prompts
  const { data, error } = await (supabase
    .from("prompts") as any)
    .select("id, title, body")
    .eq("active", true);

  if (error) {
    console.error("Error fetching rotating prompts:", error);
    return [];
  }

  // Shuffle array for random order (with default story_count of 0)
  const shuffled = (data || []).map((p: any) => ({ ...p, story_count: 0 })).sort(() => Math.random() - 0.5);
  return shuffled as Prompt[];
}

/**
 * Get stories for a prompt
 */
export async function getPromptStories(promptId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from("stories") as any)
    .select("*, likes(count), comments(count)")
    .eq("prompt_id", promptId)
    .eq("status", "published")
    .eq("soft_deleted", false)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching prompt stories:", error);
    return [];
  }

  return (data || []).map((story: any) => ({
    ...story,
    likes_count: Array.isArray(story.likes) ? story.likes[0]?.count || 0 : 0,
    comments_count: Array.isArray(story.comments) ? story.comments[0]?.count || 0 : 0,
    first_image_url: extractFirstImage(story.body),
  })) as StoryWithCounts[];
}

// =============================================================================
// COLLECTIONS
// =============================================================================

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
    first_image_url: extractFirstImage(story.body),
  })) as StoryWithCounts[];

  return { collection, stories: storiesWithCounts };
}

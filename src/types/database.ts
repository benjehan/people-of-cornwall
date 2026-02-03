/**
 * People of Cornwall — Database Types
 * Matches the Supabase schema defined in ARCHITECTURE.md
 */

// =============================================================================
// ENUMS
// =============================================================================

export type StoryStatus =
  | "draft"
  | "review"
  | "published"
  | "rejected"
  | "unpublished";

export type MediaType = "image" | "video" | "audio";

export type CommentStatus = "visible" | "hidden" | "flagged";

export type UserRole = "user" | "moderator" | "admin";

// =============================================================================
// TABLES
// =============================================================================

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

// Poll/Voting types
export type PollCategory = 
  | "best_joke"
  | "best_business"
  | "best_pub"
  | "best_kindness"
  | "best_event"
  | "best_memory"
  | "best_site"
  | "other";

export interface Poll {
  id: string;
  title: string;
  description?: string | null;
  category: PollCategory;
  location_name?: string | null;
  is_active: boolean;
  starts_at: string;
  ends_at?: string | null;
  created_at: string;
  created_by?: string | null;
}

export interface PollNomination {
  id: string;
  poll_id: string;
  user_id: string;
  title: string;
  description?: string | null;
  location_name?: string | null;
  image_url?: string | null;
  is_approved: boolean;
  created_at: string;
  vote_count?: number;
  user_has_voted?: boolean;
}

export interface PollVote {
  id: string;
  poll_id: string;
  nomination_id: string;
  user_id: string;
  created_at: string;
}

// Badge types
export type BadgeType = 
  | "first_story"
  | "storyteller_5"
  | "storyteller_10"
  | "storyteller_25"
  | "voice_keeper"
  | "memory_keeper"
  | "local_legend"
  | "community_star"
  | "ambassador"
  | "founding_member"
  | "helpful_voice"
  | "popular_story";

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  awarded_at: string;
  awarded_reason?: string | null;
}

// Digest subscription
export type DigestFrequency = "weekly" | "monthly" | "never";

export interface DigestSubscription {
  id: string;
  user_id?: string | null;
  email: string;
  frequency: DigestFrequency;
  unsubscribe_token: string;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at?: string | null;
  last_sent_at?: string | null;
}

export interface Story {
  id: string;
  title: string;
  body: string | null;
  author_id: string;
  author_display_name: string | null;
  anonymous: boolean;
  status: StoryStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  timeline_year: number | null;
  timeline_decade: number | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  ai_summary: string | null;
  ai_tags: string[] | null;
  soft_deleted: boolean;
  featured?: boolean;
  ambient_sound?: string | null;
  voice_preference?: "male" | "female" | null;
  voice_recording_url?: string | null;
  voice_recording_duration?: number | null;
  story_format?: "standard" | "mini" | "audio" | null;
}

export interface Media {
  id: string;
  story_id: string;
  type: MediaType;
  url: string;
  caption: string | null;
  order_index: number;
}

export interface Comment {
  id: string;
  story_id: string;
  user_id: string;
  body: string;
  status: CommentStatus;
  created_at: string;
}

export interface Like {
  id: string;
  story_id: string;
  user_id: string;
  created_at: string;
}

export interface Collection {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface StoryCollection {
  story_id: string;
  collection_id: string;
}

// =============================================================================
// JOINED TYPES (for queries with relations)
// =============================================================================

export interface StoryWithAuthor extends Story {
  author: User | null;
}

export interface StoryWithMedia extends Story {
  media: Media[];
}

export interface StoryWithDetails extends Story {
  author: User | null;
  media: Media[];
  comments_count: number;
  likes_count: number;
  has_liked?: boolean;
  first_image_url?: string | null;
}

export interface CommentWithAuthor extends Comment {
  author: User;
}

export interface CollectionWithStories extends Collection {
  stories: Story[];
  story_count: number;
}

// =============================================================================
// FORM TYPES
// =============================================================================

export interface CreateStoryInput {
  title: string;
  body?: string;
  anonymous?: boolean;
  timeline_year?: number;
  timeline_decade?: number;
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
}

export interface UpdateStoryInput extends Partial<CreateStoryInput> {
  id: string;
}

export interface CreateCommentInput {
  story_id: string;
  body: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface StoryFilters {
  status?: StoryStatus;
  timeline_decade?: number;
  location_name?: string;
  collection_id?: string;
  author_id?: string;
  search?: string;
  tags?: string[];
}

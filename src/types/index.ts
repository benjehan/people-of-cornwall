/**
 * People of Cornwall — Type Exports
 */

export * from "./database";

// =============================================================================
// COMMON TYPES
// =============================================================================

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// =============================================================================
// MICROCOPY — Following brand guidelines
// =============================================================================

/**
 * Brand-appropriate microcopy for the platform.
 * Use these instead of social media language.
 */
export const Microcopy = {
  // Actions
  shareStory: "Share a story",
  sendForReview: "Send for review",
  saveAsDraft: "Save as draft",
  editStory: "Edit story",
  unpublish: "Unpublish",
  
  // Labels
  recordedIn: "Recorded in",
  sharedBy: "Shared by",
  anonymous: "Anonymous contributor",
  recentlyShared: "Recently shared",
  featuredExhibition: "Featured Exhibition",
  storiesByPlace: "Stories by place",
  storiesByTime: "Stories by time",
  collections: "Collections",
  communityPrompts: "Community prompts",
  
  // Status
  draft: "Draft",
  inReview: "In review",
  published: "Published",
  rejected: "Needs changes",
  
  // AI
  curatorNote: "Curator's note",
  
  // Empty states
  noStoriesYet: "No stories have been shared yet",
  beTheFirst: "Be the first to share a story from Cornwall",
  
  // CTA
  shareYourStory: "Share your story",
  exploreStories: "Explore stories",
  viewOnMap: "View on map",
  browseTimeline: "Browse timeline",
} as const;

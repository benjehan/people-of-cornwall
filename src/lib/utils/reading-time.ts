/**
 * Calculate reading time for a story
 * Average reading speed: 200-250 words per minute
 */
export function calculateReadingTime(html: string | null): number {
  if (!html) return 1;
  
  // Strip HTML tags
  const text = html.replace(/<[^>]*>/g, "");
  
  // Count words (split by whitespace)
  const words = text.trim().split(/\s+/).length;
  
  // Calculate minutes (use 200 wpm for slightly slower reading of stories)
  const minutes = Math.ceil(words / 200);
  
  return Math.max(1, minutes); // Minimum 1 minute
}

/**
 * Format reading time for display
 */
export function formatReadingTime(minutes: number): string {
  if (minutes === 1) return "1 min read";
  return `${minutes} min read`;
}

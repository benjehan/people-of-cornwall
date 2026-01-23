"use client";

import { useEffect, useRef } from "react";

interface ViewTrackerProps {
  storyId: string;
}

export function ViewTracker({ storyId }: ViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    // Only track once per page load
    if (tracked.current) return;
    tracked.current = true;

    // Track view after a short delay (ensures actual page view, not bounce)
    const timer = setTimeout(async () => {
      try {
        await fetch(`/api/stories/${storyId}/view`, {
          method: "POST",
        });
      } catch (error) {
        // Silently fail - view tracking is not critical
        console.error("View tracking failed:", error);
      }
    }, 3000); // 3 second delay

    return () => clearTimeout(timer);
  }, [storyId]);

  return null; // This component doesn't render anything
}

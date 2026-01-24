"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Badge {
  id: string;
  badge_type: string;
  awarded_at: string;
  awarded_reason: string | null;
}

// Badge definitions with emojis and descriptions
const BADGE_INFO: Record<string, { emoji: string; name: string; description: string; color: string }> = {
  first_story: {
    emoji: "📝",
    name: "First Story",
    description: "Published their first story",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  storyteller_5: {
    emoji: "📚",
    name: "Storyteller",
    description: "Published 5 stories",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  storyteller_10: {
    emoji: "🏆",
    name: "Master Storyteller",
    description: "Published 10 stories",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  voice_of_cornwall: {
    emoji: "🎙️",
    name: "Voice of Cornwall",
    description: "Added audio narration to a story",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  prompt_responder: {
    emoji: "💡",
    name: "Prompt Responder",
    description: "Responded to a writing prompt",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  community_voter: {
    emoji: "🗳️",
    name: "Community Voter",
    description: "Participated in community polls",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  poll_winner: {
    emoji: "🥇",
    name: "Poll Winner",
    description: "Nomination won a community poll",
    color: "bg-amber-100 text-amber-900 border-amber-300",
  },
  early_supporter: {
    emoji: "⭐",
    name: "Early Supporter",
    description: "One of the first community members",
    color: "bg-rose-100 text-rose-800 border-rose-200",
  },
  location_expert: {
    emoji: "📍",
    name: "Location Expert",
    description: "Correctly identified a mystery location",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
  },
};

interface UserBadgesProps {
  userId: string;
  showAll?: boolean;
  size?: "sm" | "md" | "lg";
}

export function UserBadges({ userId, showAll = false, size = "md" }: UserBadgesProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      const supabase = createClient();
      const { data, error } = await (supabase
        .from("user_badges") as any)
        .select("*")
        .eq("user_id", userId)
        .order("awarded_at", { ascending: false });

      if (!error && data) {
        setBadges(data);
      }
      setIsLoading(false);
    };

    fetchBadges();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`animate-pulse rounded-full bg-gray-200 ${
              size === "sm" ? "h-5 w-5" : size === "lg" ? "h-10 w-10" : "h-7 w-7"
            }`}
          />
        ))}
      </div>
    );
  }

  if (badges.length === 0) return null;

  const displayBadges = showAll ? badges : badges.slice(0, 5);
  const remaining = badges.length - displayBadges.length;

  const sizeClasses = {
    sm: "h-6 px-2 text-xs gap-1",
    md: "h-7 px-2.5 text-sm gap-1.5",
    lg: "h-9 px-3 text-base gap-2",
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayBadges.map((badge) => {
        const info = BADGE_INFO[badge.badge_type] || {
          emoji: "🏅",
          name: badge.badge_type.replace(/_/g, " "),
          description: badge.awarded_reason || "Achievement unlocked",
          color: "bg-gray-100 text-gray-800 border-gray-200",
        };

        return (
          <div
            key={badge.id}
            className={`flex items-center rounded-full border ${info.color} ${sizeClasses[size]}`}
            title={`${info.name}: ${info.description}`}
          >
            <span>{info.emoji}</span>
            {size !== "sm" && <span className="font-medium">{info.name}</span>}
          </div>
        );
      })}
      {remaining > 0 && (
        <div
          className={`flex items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-600 ${sizeClasses[size]}`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

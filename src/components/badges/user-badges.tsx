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
  // ===== Stories =====
  first_story: {
    emoji: "📝",
    name: "First Story",
    description: "Published their first story",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  storyteller_5: {
    emoji: "✍️",
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
  
  // ===== Where Is This =====
  location_expert: {
    emoji: "📍",
    name: "Location Expert",
    description: "Correctly identified a mystery location",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
  },
  sharp_eye: {
    emoji: "🎯",
    name: "Sharp Eye",
    description: "Correctly identified 5 mystery locations",
    color: "bg-teal-100 text-teal-800 border-teal-200",
  },
  cornish_guide: {
    emoji: "🗺️",
    name: "Cornish Guide",
    description: "Correctly identified 10 mystery locations",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  challenge_creator: {
    emoji: "🔍",
    name: "Challenge Creator",
    description: "Submitted a Where Is This challenge",
    color: "bg-sky-100 text-sky-800 border-sky-200",
  },
  
  // ===== Lost Cornwall =====
  memory_keeper: {
    emoji: "📷",
    name: "Memory Keeper",
    description: "Shared a memory on Lost Cornwall",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
  historian: {
    emoji: "📚",
    name: "Historian",
    description: "Shared 10+ memories on Lost Cornwall",
    color: "bg-amber-100 text-amber-900 border-amber-300",
  },
  photo_contributor: {
    emoji: "🖼️",
    name: "Photo Contributor",
    description: "Contributed a historic photo",
    color: "bg-stone-100 text-stone-800 border-stone-200",
  },
  
  // ===== Events =====
  event_organizer: {
    emoji: "🗓️",
    name: "Event Organizer",
    description: "Submitted a community event",
    color: "bg-violet-100 text-violet-800 border-violet-200",
  },
  community_builder: {
    emoji: "🎉",
    name: "Community Builder",
    description: "Submitted 5+ community events",
    color: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  },
  
  // ===== Polls =====
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
    color: "bg-yellow-100 text-yellow-900 border-yellow-300",
  },
  
  // ===== General =====
  social_butterfly: {
    emoji: "💬",
    name: "Social Butterfly",
    description: "Left 10+ comments across the platform",
    color: "bg-pink-100 text-pink-800 border-pink-200",
  },
  early_supporter: {
    emoji: "⭐",
    name: "Early Supporter",
    description: "One of the first community members",
    color: "bg-rose-100 text-rose-800 border-rose-200",
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

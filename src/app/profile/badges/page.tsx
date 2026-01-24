"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Award, 
  ChevronLeft, 
  Lock, 
  CheckCircle2,
  Star,
  Sparkles,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";

// All available badges with their requirements
const ALL_BADGES = [
  // Stories
  { 
    type: "first_story", 
    emoji: "📝", 
    name: "First Story", 
    description: "Publish your first story",
    category: "Stories",
    requirement: 1,
    unit: "stories",
    gradient: "from-amber-400 to-orange-500",
  },
  { 
    type: "storyteller_5", 
    emoji: "✍️", 
    name: "Storyteller", 
    description: "Publish 5 stories",
    category: "Stories",
    requirement: 5,
    unit: "stories",
    gradient: "from-blue-400 to-indigo-500",
  },
  { 
    type: "storyteller_10", 
    emoji: "🏆", 
    name: "Master Storyteller", 
    description: "Publish 10 stories",
    category: "Stories",
    requirement: 10,
    unit: "stories",
    gradient: "from-purple-400 to-purple-600",
  },
  { 
    type: "voice_of_cornwall", 
    emoji: "🎙️", 
    name: "Voice of Cornwall", 
    description: "Add audio narration to a story",
    category: "Stories",
    requirement: 1,
    unit: "audio stories",
    gradient: "from-green-400 to-emerald-500",
  },
  { 
    type: "prompt_responder", 
    emoji: "💡", 
    name: "Prompt Responder", 
    description: "Write a story from a community prompt",
    category: "Stories",
    requirement: 1,
    unit: "prompt responses",
    gradient: "from-yellow-400 to-amber-500",
  },
  
  // Where Is This
  { 
    type: "location_expert", 
    emoji: "📍", 
    name: "Location Expert", 
    description: "Correctly identify a mystery location",
    category: "Where Is This",
    requirement: 1,
    unit: "correct guesses",
    gradient: "from-cyan-400 to-blue-500",
  },
  { 
    type: "sharp_eye", 
    emoji: "🎯", 
    name: "Sharp Eye", 
    description: "Correctly identify 5 mystery locations",
    category: "Where Is This",
    requirement: 5,
    unit: "correct guesses",
    gradient: "from-teal-400 to-cyan-500",
  },
  { 
    type: "cornish_guide", 
    emoji: "🗺️", 
    name: "Cornish Guide", 
    description: "Correctly identify 10 mystery locations",
    category: "Where Is This",
    requirement: 10,
    unit: "correct guesses",
    gradient: "from-emerald-400 to-teal-500",
  },
  { 
    type: "challenge_creator", 
    emoji: "🔍", 
    name: "Challenge Creator", 
    description: "Submit a Where Is This challenge",
    category: "Where Is This",
    requirement: 1,
    unit: "challenges submitted",
    gradient: "from-sky-400 to-blue-500",
  },
  
  // Lost Cornwall
  { 
    type: "memory_keeper", 
    emoji: "📷", 
    name: "Memory Keeper", 
    description: "Share a memory on Lost Cornwall",
    category: "Lost Cornwall",
    requirement: 1,
    unit: "memories shared",
    gradient: "from-orange-400 to-red-500",
  },
  { 
    type: "historian", 
    emoji: "📚", 
    name: "Historian", 
    description: "Share 10+ memories on Lost Cornwall",
    category: "Lost Cornwall",
    requirement: 10,
    unit: "memories shared",
    gradient: "from-amber-500 to-orange-600",
  },
  { 
    type: "photo_contributor", 
    emoji: "🖼️", 
    name: "Photo Contributor", 
    description: "Contribute a historic photo",
    category: "Lost Cornwall",
    requirement: 1,
    unit: "photos contributed",
    gradient: "from-stone-400 to-stone-600",
  },
  
  // Events
  { 
    type: "event_organizer", 
    emoji: "🗓️", 
    name: "Event Organizer", 
    description: "Submit a community event",
    category: "Events",
    requirement: 1,
    unit: "events submitted",
    gradient: "from-violet-400 to-purple-500",
  },
  { 
    type: "community_builder", 
    emoji: "🎉", 
    name: "Community Builder", 
    description: "Submit 5+ community events",
    category: "Events",
    requirement: 5,
    unit: "events submitted",
    gradient: "from-fuchsia-400 to-pink-500",
  },
  
  // Polls
  { 
    type: "community_voter", 
    emoji: "🗳️", 
    name: "Community Voter", 
    description: "Vote in a community poll",
    category: "Polls",
    requirement: 1,
    unit: "votes cast",
    gradient: "from-indigo-400 to-violet-500",
  },
  { 
    type: "poll_winner", 
    emoji: "🥇", 
    name: "Poll Winner", 
    description: "Your nomination wins a poll!",
    category: "Polls",
    requirement: 1,
    unit: "wins",
    gradient: "from-yellow-400 to-amber-500",
  },
  
  // Social
  { 
    type: "social_butterfly", 
    emoji: "💬", 
    name: "Social Butterfly", 
    description: "Leave 10+ comments",
    category: "Community",
    requirement: 10,
    unit: "comments",
    gradient: "from-pink-400 to-rose-500",
  },
  { 
    type: "early_supporter", 
    emoji: "⭐", 
    name: "Early Supporter", 
    description: "One of the first community members",
    category: "Special",
    requirement: 1,
    unit: "founding member",
    gradient: "from-rose-400 to-red-500",
  },
];

interface UserStats {
  stories_count: number;
  audio_stories_count: number;
  prompt_responses_count: number;
  location_wins: number;
  challenges_submitted: number;
  memories_count: number;
  photos_contributed: number;
  events_submitted: number;
  votes_cast: number;
  poll_wins: number;
  comments_count: number;
}

interface Badge {
  id: string;
  badge_type: string;
  awarded_at: string;
}

export default function BadgesDashboard() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/profile/badges");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user) {
      loadBadgesAndStats();
    }
  }, [user]);

  const loadBadgesAndStats = async () => {
    if (!user) return;
    setLoadingStats(true);
    
    const supabase = createClient();

    // Load badges
    const { data: badgesData } = await (supabase
      .from("user_badges") as any)
      .select("*")
      .eq("user_id", user.id);
    
    setBadges(badgesData || []);

    // Load stats from various tables
    const [
      { count: storiesCount },
      { count: audioCount },
      { count: promptCount },
      { data: userData },
      { count: challengesCount },
      { count: memoriesCount },
      { count: photosCount },
      { count: eventsCount },
      { count: votesCount },
      { count: pollWinsCount },
      { count: commentsCount },
    ] = await Promise.all([
      // Stories
      (supabase.from("stories") as any).select("*", { count: "exact", head: true }).eq("author_id", user.id).eq("status", "published"),
      // Audio stories
      (supabase.from("stories") as any).select("*", { count: "exact", head: true }).eq("author_id", user.id).not("voice_recording_url", "is", null),
      // Prompt responses
      (supabase.from("stories") as any).select("*", { count: "exact", head: true }).eq("author_id", user.id).not("prompt_id", "is", null).eq("status", "published"),
      // User data for location_wins
      (supabase.from("users") as any).select("location_wins, memories_count, total_comments").eq("id", user.id).single(),
      // Challenges submitted
      (supabase.from("where_is_this") as any).select("*", { count: "exact", head: true }).eq("submitted_by", user.id),
      // Memories shared
      (supabase.from("lost_cornwall_memories") as any).select("*", { count: "exact", head: true }).eq("user_id", user.id),
      // Photos contributed
      (supabase.from("lost_cornwall") as any).select("*", { count: "exact", head: true }).eq("submitted_by", user.id).eq("is_approved", true),
      // Events submitted
      (supabase.from("events") as any).select("*", { count: "exact", head: true }).eq("created_by", user.id).eq("is_approved", true),
      // Votes cast
      (supabase.from("poll_votes") as any).select("*", { count: "exact", head: true }).eq("user_id", user.id),
      // Poll wins (nominations that won)
      (supabase.from("polls") as any)
        .select("winner_nomination_id, poll_nominations!inner(user_id)")
        .eq("poll_nominations.user_id", user.id)
        .not("winner_nomination_id", "is", null),
      // Comments
      (supabase.from("comments") as any).select("*", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

    setStats({
      stories_count: storiesCount || 0,
      audio_stories_count: audioCount || 0,
      prompt_responses_count: promptCount || 0,
      location_wins: userData?.location_wins || 0,
      challenges_submitted: challengesCount || 0,
      memories_count: memoriesCount || 0,
      photos_contributed: photosCount || 0,
      events_submitted: eventsCount || 0,
      votes_cast: votesCount || 0,
      poll_wins: pollWinsCount || 0,
      comments_count: commentsCount || 0,
    });

    setLoadingStats(false);
  };

  // Get progress for a badge
  const getProgress = (badge: typeof ALL_BADGES[0]): number => {
    if (!stats) return 0;
    
    switch (badge.type) {
      case "first_story":
      case "storyteller_5":
      case "storyteller_10":
        return Math.min(stats.stories_count / badge.requirement * 100, 100);
      case "voice_of_cornwall":
        return Math.min(stats.audio_stories_count / badge.requirement * 100, 100);
      case "prompt_responder":
        return Math.min(stats.prompt_responses_count / badge.requirement * 100, 100);
      case "location_expert":
      case "sharp_eye":
      case "cornish_guide":
        return Math.min(stats.location_wins / badge.requirement * 100, 100);
      case "challenge_creator":
        return Math.min(stats.challenges_submitted / badge.requirement * 100, 100);
      case "memory_keeper":
      case "historian":
        return Math.min(stats.memories_count / badge.requirement * 100, 100);
      case "photo_contributor":
        return Math.min(stats.photos_contributed / badge.requirement * 100, 100);
      case "event_organizer":
      case "community_builder":
        return Math.min(stats.events_submitted / badge.requirement * 100, 100);
      case "community_voter":
        return Math.min(stats.votes_cast / badge.requirement * 100, 100);
      case "poll_winner":
        return Math.min(stats.poll_wins / badge.requirement * 100, 100);
      case "social_butterfly":
        return Math.min(stats.comments_count / badge.requirement * 100, 100);
      case "early_supporter":
        return badges.some(b => b.badge_type === "early_supporter") ? 100 : 0;
      default:
        return 0;
    }
  };

  // Get current count for a badge
  const getCurrentCount = (badge: typeof ALL_BADGES[0]): number => {
    if (!stats) return 0;
    
    switch (badge.type) {
      case "first_story":
      case "storyteller_5":
      case "storyteller_10":
        return stats.stories_count;
      case "voice_of_cornwall":
        return stats.audio_stories_count;
      case "prompt_responder":
        return stats.prompt_responses_count;
      case "location_expert":
      case "sharp_eye":
      case "cornish_guide":
        return stats.location_wins;
      case "challenge_creator":
        return stats.challenges_submitted;
      case "memory_keeper":
      case "historian":
        return stats.memories_count;
      case "photo_contributor":
        return stats.photos_contributed;
      case "event_organizer":
      case "community_builder":
        return stats.events_submitted;
      case "community_voter":
        return stats.votes_cast;
      case "poll_winner":
        return stats.poll_wins;
      case "social_butterfly":
        return stats.comments_count;
      default:
        return 0;
    }
  };

  const earnedBadgeTypes = badges.map(b => b.badge_type);
  const earnedCount = earnedBadgeTypes.length;
  const totalCount = ALL_BADGES.length;

  // Group badges by category
  const categories = [...new Set(ALL_BADGES.map(b => b.category))];

  if (isLoading || loadingStats) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-copper border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-parchment">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Link href="/profile" className="inline-flex items-center gap-1 text-stone hover:text-granite mb-6 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Profile
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-copper/10 border border-copper/20 text-copper text-sm font-medium mb-4">
            <Award className="h-4 w-4" />
            Your Achievements
          </div>
          <h1 className="font-serif text-4xl text-granite mb-3">Badge Collection</h1>
          <p className="text-stone max-w-lg mx-auto">
            Earn badges by participating in the community. Track your progress toward each achievement.
          </p>
        </div>

        {/* Overall Progress */}
        <Card className="bg-cream border-bone mb-8 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-copper">
                  <Sparkles className="h-6 w-6 text-parchment" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-granite">Collection Progress</h2>
                  <p className="text-stone text-sm">You've earned {earnedCount} of {totalCount} badges</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-copper">
                {Math.round(earnedCount / totalCount * 100)}%
              </div>
            </div>
            <div className="h-3 bg-bone rounded-full overflow-hidden">
              <div 
                className="h-full bg-copper rounded-full transition-all duration-500"
                style={{ width: `${earnedCount / totalCount * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Badges by Category */}
        {categories.map(category => (
          <div key={category} className="mb-8">
            <h2 className="font-serif text-xl text-granite mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-copper" />
              {category}
            </h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {ALL_BADGES.filter(b => b.category === category).map(badge => {
                const isEarned = earnedBadgeTypes.includes(badge.type);
                const progress = getProgress(badge);
                const current = getCurrentCount(badge);
                
                return (
                  <Card 
                    key={badge.type} 
                    className={`overflow-hidden transition-all ${
                      isEarned 
                        ? "bg-cream border-copper/30 shadow-md" 
                        : "bg-parchment border-bone"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Badge Icon */}
                        <div className={`relative flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                          isEarned 
                            ? `bg-gradient-to-br ${badge.gradient}` 
                            : "bg-bone"
                        }`}>
                          {isEarned ? (
                            badge.emoji
                          ) : (
                            <>
                              <span className="opacity-40">{badge.emoji}</span>
                              <Lock className="absolute inset-0 m-auto h-5 w-5 text-stone/50" />
                            </>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-medium truncate ${isEarned ? "text-granite" : "text-stone"}`}>
                              {badge.name}
                            </h3>
                            {isEarned && (
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className={`text-sm mb-2 ${isEarned ? "text-stone" : "text-silver"}`}>
                            {badge.description}
                          </p>
                          
                          {/* Progress */}
                          {!isEarned && badge.type !== "early_supporter" && (
                            <div className="space-y-1">
                              <div className="h-1.5 bg-bone rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-copper rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <p className="text-xs text-silver">
                                {current} / {badge.requirement} {badge.unit}
                              </p>
                            </div>
                          )}
                          
                          {isEarned && (
                            <p className="text-xs text-copper">
                              ✓ Earned
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {/* CTA */}
        <Card className="bg-gradient-to-r from-copper/10 to-atlantic/10 border-copper/20 mt-8">
          <CardContent className="p-6 text-center">
            <h3 className="font-serif text-xl text-granite mb-2">Keep Contributing!</h3>
            <p className="text-stone mb-4">
              Every story, comment, and vote brings you closer to earning more badges.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/write">
                <Button className="bg-granite text-parchment hover:bg-slate">
                  Write a Story
                </Button>
              </Link>
              <Link href="/polls">
                <Button variant="outline" className="border-granite text-granite hover:bg-granite hover:text-parchment">
                  Vote in Polls
                </Button>
              </Link>
              <Link href="/where-is-this">
                <Button variant="outline" className="border-granite text-granite hover:bg-granite hover:text-parchment">
                  Play Where Is This?
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

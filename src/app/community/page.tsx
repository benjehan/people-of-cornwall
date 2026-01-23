"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Trophy, 
  Vote, 
  Star, 
  Heart, 
  MapPin, 
  Calendar,
  ThumbsUp,
  Award,
  Loader2,
  Plus,
  Beer,
  Store,
  Laugh,
  Sparkles,
  Mountain,
  PartyPopper,
  CheckCircle,
  Coffee,
  UtensilsCrossed,
  Footprints,
  Waves,
  ShoppingBag,
  User,
  Share2,
  Clock,
  Filter,
  Medal,
  Crown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

// Poll category icons and labels
const POLL_CATEGORIES = {
  best_joke: { icon: Laugh, label: "Best Cornish Joke", emoji: "😂" },
  best_business: { icon: Store, label: "Best Local Business", emoji: "🏪" },
  best_pub: { icon: Beer, label: "Best Pub", emoji: "🍺" },
  best_cafe: { icon: Coffee, label: "Best Café", emoji: "☕" },
  best_restaurant: { icon: UtensilsCrossed, label: "Best Restaurant", emoji: "🍽️" },
  best_walk: { icon: Footprints, label: "Best Walk", emoji: "🥾" },
  best_beach: { icon: Waves, label: "Best Beach", emoji: "🏖️" },
  best_kindness: { icon: Heart, label: "Best Act of Kindness", emoji: "💖" },
  best_event: { icon: PartyPopper, label: "Best Event", emoji: "🎉" },
  best_memory: { icon: Sparkles, label: "Best Memory", emoji: "✨" },
  best_site: { icon: Mountain, label: "Most Iconic Site", emoji: "🏔️" },
  best_shop: { icon: ShoppingBag, label: "Best Local Shop", emoji: "🛍️" },
  best_character: { icon: User, label: "Most Memorable Character", emoji: "👤" },
  other: { icon: Star, label: "Other", emoji: "⭐" },
};

interface Poll {
  id: string;
  title: string;
  description: string | null;
  category: keyof typeof POLL_CATEGORIES;
  location_name: string | null;
  is_active: boolean;
  nominations_end_at: string | null;
  voting_start_at: string | null;
  voting_end_at: string | null;
  nominations: Nomination[];
}

// Countdown helper
function getCountdown(targetDate: string | null): string | null {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  
  if (diff <= 0) return "Ended";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  return "Ending soon";
}

// Poll phase helper
function getPollPhase(poll: Poll): "nominations" | "voting" | "ended" {
  const now = new Date();
  
  if (poll.voting_end_at && new Date(poll.voting_end_at) < now) {
    return "ended";
  }
  if (poll.voting_start_at && new Date(poll.voting_start_at) <= now) {
    return "voting";
  }
  return "nominations";
}

interface Nomination {
  id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  vote_count: number;
  user_has_voted: boolean;
}

// Winner type for ended polls
interface PollWinner {
  poll: Poll;
  top3: Nomination[];
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [winners, setWinners] = useState<PollWinner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState<string | null>(null);
  const [nominateDialogOpen, setNominateDialogOpen] = useState(false);
  const [nominatePollId, setNominatePollId] = useState<string | null>(null);
  const [nominationTitle, setNominationTitle] = useState("");
  const [nominationDescription, setNominationDescription] = useState("");
  const [nominationLocation, setNominationLocation] = useState("");
  const [isNominating, setIsNominating] = useState(false);
  const [nominationSuccess, setNominationSuccess] = useState(false);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    loadPolls();
    loadWinners();
    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    if (!user?.email) return;
    const supabase = createClient();
    const { data } = await (supabase
      .from("digest_subscriptions") as any)
      .select("is_active")
      .eq("email", user.email)
      .single();
    if (data?.is_active) {
      setIsSubscribed(true);
    }
  };

  const handleSubscribe = async () => {
    if (!user?.email) return;
    
    setIsSubscribing(true);
    const supabase = createClient();

    // Check if already exists
    const { data: existing } = await (supabase
      .from("digest_subscriptions") as any)
      .select("id, is_active")
      .eq("email", user.email)
      .single();

    if (existing) {
      // Reactivate if inactive
      await (supabase
        .from("digest_subscriptions") as any)
        .update({ is_active: true, frequency: "weekly" })
        .eq("id", existing.id);
    } else {
      // Create new subscription
      await (supabase
        .from("digest_subscriptions") as any)
        .insert({
          email: user.email,
          user_id: user.id,
          frequency: "weekly",
          is_active: true,
        });
    }

    setIsSubscribed(true);
    setIsSubscribing(false);
    setSubscribeMessage("You're subscribed! Check your inbox every Sunday.");
    setTimeout(() => setSubscribeMessage(null), 5000);
  };

  const openNominateDialog = (pollId: string) => {
    setNominatePollId(pollId);
    setNominationTitle("");
    setNominationDescription("");
    setNominationLocation("");
    setNominationSuccess(false);
    setNominateDialogOpen(true);
  };

  const handleNominate = async () => {
    if (!user || !nominatePollId || !nominationTitle.trim()) return;
    
    setIsNominating(true);
    const supabase = createClient();

    const { data: nomData, error } = await (supabase
      .from("poll_nominations") as any)
      .insert({
        poll_id: nominatePollId,
        user_id: user.id,
        title: nominationTitle.trim(),
        description: nominationDescription.trim() || null,
        location_name: nominationLocation.trim() || null,
        is_approved: false, // Requires admin approval
      })
      .select()
      .single();

    if (error) {
      console.error("Nomination error:", error);
    } else {
      // Run moderation check and notify admin
      const poll = polls.find(p => p.id === nominatePollId);
      try {
        await fetch("/api/moderation/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "poll_nomination",
            content: {
              title: nominationTitle.trim(),
              description: nominationDescription.trim(),
            },
            submitterId: user.id,
            submitterEmail: user.email,
            itemId: nomData?.id,
          }),
        });
      } catch (err) {
        console.error("Moderation check failed:", err);
      }

      setNominationSuccess(true);
      setTimeout(() => {
        setNominateDialogOpen(false);
        loadPolls();
      }, 2000);
    }
    setIsNominating(false);
  };

  const loadPolls = async () => {
    setIsLoading(true);
    const supabase = createClient();

    // Get active polls with nominations (cast to any for new tables)
    const { data: pollsData, error } = await (supabase
      .from("polls") as any)
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error || !pollsData) {
      console.error("Error loading polls:", error);
      setIsLoading(false);
      return;
    }

    // Get nominations for each poll
    const pollsWithNominations = await Promise.all(
      pollsData.map(async (poll: Poll) => {
        const { data: nominations } = await (supabase
          .from("poll_nominations") as any)
          .select("*")
          .eq("poll_id", poll.id)
          .eq("is_approved", true);

        // Get vote counts
        const nominationsWithVotes = await Promise.all(
          (nominations || []).map(async (nom: Nomination) => {
            const { count } = await (supabase
              .from("poll_votes") as any)
              .select("*", { count: "exact", head: true })
              .eq("nomination_id", nom.id);

            // Check if user has voted for this nomination
            let userHasVoted = false;
            if (user) {
              const { data: vote } = await (supabase
                .from("poll_votes") as any)
                .select("id")
                .eq("nomination_id", nom.id)
                .eq("user_id", user.id)
                .single();
              userHasVoted = !!vote;
            }

            return {
              ...nom,
              vote_count: count || 0,
              user_has_voted: userHasVoted,
            };
          })
        );

        return {
          ...poll,
          nominations: nominationsWithVotes.sort((a: Nomination, b: Nomination) => b.vote_count - a.vote_count),
        };
      })
    );

    setPolls(pollsWithNominations);
    setIsLoading(false);
  };

  // Load ended polls with winners
  const loadWinners = async () => {
    const supabase = createClient();
    const now = new Date().toISOString();

    // Get ended polls (voting_end_at in the past)
    const { data: endedPolls, error } = await (supabase
      .from("polls") as any)
      .select("*")
      .lt("voting_end_at", now)
      .order("voting_end_at", { ascending: false })
      .limit(10);

    if (error || !endedPolls) {
      console.error("Error loading winners:", error);
      return;
    }

    // Get top 3 nominations for each ended poll
    const winnersData = await Promise.all(
      endedPolls.map(async (poll: Poll) => {
        const { data: nominations } = await (supabase
          .from("poll_nominations") as any)
          .select("*")
          .eq("poll_id", poll.id)
          .eq("is_approved", true);

        // Get vote counts
        const nominationsWithVotes = await Promise.all(
          (nominations || []).map(async (nom: Nomination) => {
            const { count } = await (supabase
              .from("poll_votes") as any)
              .select("*", { count: "exact", head: true })
              .eq("nomination_id", nom.id);

            return {
              ...nom,
              vote_count: count || 0,
              user_has_voted: false,
            };
          })
        );

        // Sort by votes and get top 3
        const top3 = nominationsWithVotes
          .sort((a: Nomination, b: Nomination) => b.vote_count - a.vote_count)
          .slice(0, 3);

        return {
          poll: { ...poll, nominations: [] },
          top3,
        };
      })
    );

    setWinners(winnersData.filter(w => w.top3.length > 0));
  };

  // Filter polls
  const filteredPolls = polls.filter(poll => {
    if (categoryFilter !== "all" && poll.category !== categoryFilter) return false;
    if (locationFilter && poll.location_name && 
        !poll.location_name.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    return true;
  });

  const handleVote = async (pollId: string, nominationId: string) => {
    if (!user) return;
    
    setVotingId(nominationId);
    const supabase = createClient();

    // Check if user already voted on this poll
    const { data: existingVote } = await (supabase
      .from("poll_votes") as any)
      .select("id, nomination_id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .single();

    if (existingVote) {
      // Remove existing vote
      await (supabase
        .from("poll_votes") as any)
        .delete()
        .eq("id", existingVote.id);

      // If voting for same nomination, just remove (toggle off)
      if (existingVote.nomination_id === nominationId) {
        await loadPolls();
        setVotingId(null);
        return;
      }
    }

    // Add new vote
    await (supabase
      .from("poll_votes") as any)
      .insert({
        poll_id: pollId,
        nomination_id: nominationId,
        user_id: user.id,
      });

    await loadPolls();
    setVotingId(null);
  };

  return (
    <div className="min-h-screen bg-parchment">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-copper/10 text-copper text-sm font-medium mb-4">
            <Trophy className="h-4 w-4" />
            Community Corner
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-granite mb-4">
            The Best of Cornwall
          </h1>
          <p className="text-stone max-w-2xl mx-auto text-lg">
            Vote for your favourites, nominate local gems, and celebrate what makes Cornwall special.
            From the best pubs to the funniest jokes — your voice matters!
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="active" className="gap-2">
              <Vote className="h-4 w-4" />
              Active Polls
            </TabsTrigger>
            <TabsTrigger value="winners" className="gap-2">
              <Trophy className="h-4 w-4" />
              Winners
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Award className="h-4 w-4" />
              Badges
            </TabsTrigger>
          </TabsList>

          {/* Active Polls */}
          <TabsContent value="active" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 p-4 bg-cream rounded-lg border border-bone">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-stone" />
                <span className="text-sm font-medium text-granite">Filter:</span>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] border-bone bg-parchment">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(POLL_CATEGORIES).map(([key, { emoji, label }]) => (
                    <SelectItem key={key} value={key}>
                      {emoji} {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1 min-w-[200px]">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
                <Input
                  placeholder="Filter by location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="pl-9 border-bone bg-parchment"
                />
              </div>
              {(categoryFilter !== "all" || locationFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setCategoryFilter("all"); setLocationFilter(""); }}
                  className="text-stone hover:text-granite"
                >
                  Clear filters
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-granite" />
              </div>
            ) : filteredPolls.length === 0 ? (
              <Card className="border-bone bg-cream text-center py-12">
                <CardContent>
                  <Vote className="h-12 w-12 text-stone mx-auto mb-4" />
                  <h3 className="font-serif text-xl text-granite mb-2">
                    {polls.length === 0 ? "No Active Polls" : "No Polls Match Your Filters"}
                  </h3>
                  <p className="text-stone mb-4">
                    {polls.length === 0 
                      ? "Check back soon for new voting opportunities!" 
                      : "Try adjusting your filters to see more polls."}
                  </p>
                  <p className="text-sm text-silver">
                    Want to suggest a poll topic? Email us at hello@peopleofcornwall.com
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredPolls.map((poll) => {
                const category = POLL_CATEGORIES[poll.category];
                const CategoryIcon = category.icon;
                const phase = getPollPhase(poll);
                const countdown = phase === "nominations" 
                  ? getCountdown(poll.nominations_end_at)
                  : phase === "voting" 
                    ? getCountdown(poll.voting_end_at)
                    : null;

                const sharePoll = () => {
                  const url = `${window.location.origin}/community#poll-${poll.id}`;
                  const text = `Vote in "${poll.title}" on People of Cornwall!`;
                  if (navigator.share) {
                    navigator.share({ title: poll.title, text, url });
                  } else {
                    navigator.clipboard.writeText(`${text}\n${url}`);
                    alert("Link copied to clipboard!");
                  }
                };
                
                return (
                  <Card key={poll.id} id={`poll-${poll.id}`} className="border-bone bg-cream overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-granite to-slate text-parchment">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-parchment/10">
                            <CategoryIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{poll.title}</CardTitle>
                            {poll.location_name && (
                              <div className="flex items-center gap-1 text-sm text-parchment/80 mt-1">
                                <MapPin className="h-3 w-3" />
                                {poll.location_name}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={sharePoll}
                            className="text-parchment/80 hover:text-parchment hover:bg-parchment/10"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Badge variant="secondary" className="bg-parchment/20 text-parchment">
                            {category.emoji} {category.label}
                          </Badge>
                        </div>
                      </div>
                      {poll.description && (
                        <CardDescription className="text-parchment/80 mt-2">
                          {poll.description}
                        </CardDescription>
                      )}
                      {/* Phase & Countdown */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-parchment/20">
                        <Badge 
                          variant="outline" 
                          className={`border-0 ${
                            phase === "nominations" ? "bg-blue-500/20 text-blue-200" :
                            phase === "voting" ? "bg-green-500/20 text-green-200" :
                            "bg-stone/20 text-stone"
                          }`}
                        >
                          {phase === "nominations" ? "📝 Nominations Open" :
                           phase === "voting" ? "🗳️ Voting Now" :
                           "✅ Ended"}
                        </Badge>
                        {countdown && countdown !== "Ended" && (
                          <span className="text-xs text-parchment/70 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {countdown}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {poll.nominations.length === 0 ? (
                        <p className="text-center text-stone py-4">
                          No nominations yet. Be the first to nominate!
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {poll.nominations.map((nom, index) => (
                            <div 
                              key={nom.id}
                              className={`flex items-center gap-4 p-4 rounded-lg border ${
                                nom.user_has_voted 
                                  ? "border-copper bg-copper/5" 
                                  : "border-bone bg-parchment"
                              }`}
                            >
                              {/* Rank */}
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                index === 0 ? "bg-yellow-500 text-white" :
                                index === 1 ? "bg-gray-400 text-white" :
                                index === 2 ? "bg-amber-600 text-white" :
                                "bg-bone text-stone"
                              }`}>
                                {index + 1}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-granite truncate">{nom.title}</h4>
                                {nom.description && (
                                  <p className="text-sm text-stone line-clamp-1">{nom.description}</p>
                                )}
                                {nom.location_name && (
                                  <div className="flex items-center gap-1 text-xs text-silver mt-1">
                                    <MapPin className="h-3 w-3" />
                                    {nom.location_name}
                                  </div>
                                )}
                              </div>

                              {/* Vote count */}
                              <div className="flex items-center gap-2 text-stone">
                                <ThumbsUp className={`h-4 w-4 ${nom.user_has_voted ? "fill-copper text-copper" : ""}`} />
                                <span className="font-medium">{nom.vote_count}</span>
                              </div>

                              {/* Vote button */}
                              {user ? (
                                <Button
                                  variant={nom.user_has_voted ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleVote(poll.id, nom.id)}
                                  disabled={votingId === nom.id}
                                  className={nom.user_has_voted 
                                    ? "bg-copper hover:bg-copper/90" 
                                    : "border-granite text-granite hover:bg-granite hover:text-parchment"
                                  }
                                >
                                  {votingId === nom.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : nom.user_has_voted ? (
                                    "Voted!"
                                  ) : (
                                    "Vote"
                                  )}
                                </Button>
                              ) : (
                                <Link href="/login">
                                  <Button variant="outline" size="sm" className="border-granite text-granite">
                                    Login to Vote
                                  </Button>
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Nominate button */}
                      {user && (
                        <div className="mt-6 pt-4 border-t border-bone text-center">
                          <Button 
                            variant="ghost" 
                            className="gap-2 text-granite hover:bg-granite hover:text-parchment"
                            onClick={() => openNominateDialog(poll.id)}
                          >
                            <Plus className="h-4 w-4" />
                            Nominate Something
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Winners - Hall of Fame */}
          <TabsContent value="winners" className="space-y-6">
            {winners.length === 0 ? (
              <Card className="border-bone bg-cream text-center py-12">
                <CardContent>
                  <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="font-serif text-xl text-granite mb-2">Hall of Fame</h3>
                  <p className="text-stone">
                    Past poll winners will be displayed here once polls close.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="font-serif text-2xl text-granite flex items-center justify-center gap-2">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    Hall of Fame
                  </h2>
                  <p className="text-stone">The people's choices across Cornwall</p>
                </div>

                {winners.map((winner) => {
                  const category = POLL_CATEGORIES[winner.poll.category] || POLL_CATEGORIES.other;
                  const CategoryIcon = category.icon;
                  const [first, second, third] = winner.top3;

                  return (
                    <Card key={winner.poll.id} className="border-bone bg-cream overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-yellow-500/20 via-parchment to-amber-500/20 border-b border-bone">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-yellow-500/20">
                            <CategoryIcon className="h-5 w-5 text-yellow-700" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg text-granite">{winner.poll.title}</CardTitle>
                            {winner.poll.location_name && (
                              <div className="flex items-center gap-1 text-sm text-stone">
                                <MapPin className="h-3 w-3" />
                                {winner.poll.location_name}
                              </div>
                            )}
                          </div>
                          <Badge className="bg-yellow-500/20 text-yellow-800 border-0">
                            {category.emoji} {category.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid md:grid-cols-3 gap-4">
                          {/* 🥇 First Place */}
                          {first && (
                            <div className="relative bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 text-center border-2 border-yellow-400 shadow-lg">
                              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                <div className="bg-yellow-500 text-white rounded-full p-2 shadow-md">
                                  <Crown className="h-5 w-5" />
                                </div>
                              </div>
                              <div className="text-4xl mt-2 mb-3">🥇</div>
                              <h4 className="font-serif font-bold text-xl text-granite mb-2">{first.title}</h4>
                              {first.location_name && (
                                <p className="text-sm text-stone flex items-center justify-center gap-1 mb-2">
                                  <MapPin className="h-3 w-3" />
                                  {first.location_name}
                                </p>
                              )}
                              <p className="text-yellow-700 font-bold text-lg">
                                {first.vote_count} {first.vote_count === 1 ? "vote" : "votes"}
                              </p>
                            </div>
                          )}

                          {/* 🥈 Second Place */}
                          {second && (
                            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 text-center border border-gray-300">
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <div className="bg-gray-400 text-white rounded-full p-1.5 shadow">
                                  <Medal className="h-4 w-4" />
                                </div>
                              </div>
                              <div className="text-3xl mt-1 mb-2">🥈</div>
                              <h4 className="font-serif font-bold text-lg text-granite mb-1">{second.title}</h4>
                              {second.location_name && (
                                <p className="text-xs text-stone flex items-center justify-center gap-1 mb-1">
                                  <MapPin className="h-3 w-3" />
                                  {second.location_name}
                                </p>
                              )}
                              <p className="text-gray-600 font-medium">
                                {second.vote_count} {second.vote_count === 1 ? "vote" : "votes"}
                              </p>
                            </div>
                          )}

                          {/* 🥉 Third Place */}
                          {third && (
                            <div className="relative bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 text-center border border-amber-300">
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <div className="bg-amber-600 text-white rounded-full p-1.5 shadow">
                                  <Medal className="h-4 w-4" />
                                </div>
                              </div>
                              <div className="text-3xl mt-1 mb-2">🥉</div>
                              <h4 className="font-serif font-bold text-lg text-granite mb-1">{third.title}</h4>
                              {third.location_name && (
                                <p className="text-xs text-stone flex items-center justify-center gap-1 mb-1">
                                  <MapPin className="h-3 w-3" />
                                  {third.location_name}
                                </p>
                              )}
                              <p className="text-amber-700 font-medium">
                                {third.vote_count} {third.vote_count === 1 ? "vote" : "votes"}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            )}
          </TabsContent>

          {/* Badges */}
          <TabsContent value="badges">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { type: "first_story", icon: "📝", name: "First Story", desc: "Published your first story" },
                { type: "storyteller_5", icon: "✍️", name: "Storyteller", desc: "Published 5 stories" },
                { type: "storyteller_10", icon: "📚", name: "Prolific Writer", desc: "Published 10 stories" },
                { type: "storyteller_25", icon: "🏆", name: "Master Storyteller", desc: "Published 25 stories" },
                { type: "voice_keeper", icon: "🎙️", name: "Voice Keeper", desc: "Recorded your first audio story" },
                { type: "memory_keeper", icon: "⏳", name: "Memory Keeper", desc: "Stories spanning 3+ decades" },
                { type: "local_legend", icon: "🗺️", name: "Local Legend", desc: "10+ stories about one location" },
                { type: "community_star", icon: "⭐", name: "Community Star", desc: "Received 50+ comments" },
                { type: "ambassador", icon: "🎖️", name: "Ambassador", desc: "Community ambassador" },
                { type: "founding_member", icon: "🌟", name: "Founding Member", desc: "Joined in the first month" },
                { type: "helpful_voice", icon: "💬", name: "Helpful Voice", desc: "20+ comments on others' stories" },
                { type: "popular_story", icon: "❤️", name: "Popular Story", desc: "Story with 100+ likes" },
              ].map((badge) => (
                <Card key={badge.type} className="border-bone bg-cream">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="text-4xl">{badge.icon}</div>
                    <div>
                      <h4 className="font-medium text-granite">{badge.name}</h4>
                      <p className="text-sm text-stone">{badge.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Newsletter CTA */}
        <div className="max-w-4xl mx-auto mt-16">
          <Card className="border-copper bg-gradient-to-r from-copper/10 to-atlantic/10">
            <CardContent className="flex flex-col md:flex-row items-center gap-6 p-8">
              <div className="flex-1">
                <h3 className="font-serif text-2xl text-granite mb-2">
                  📬 Weekly Story Digest
                </h3>
                <p className="text-stone">
                  Get the 3 most popular stories of the week delivered to your inbox every Sunday.
                </p>
                {subscribeMessage && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {subscribeMessage}
                  </p>
                )}
              </div>
              {user ? (
                isSubscribed ? (
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Subscribed!</span>
                    </div>
                    <Link href="/profile/settings" className="text-sm text-atlantic hover:underline">
                      Manage preferences
                    </Link>
                  </div>
                ) : (
                  <Button 
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                    className="bg-granite text-parchment hover:bg-slate"
                  >
                    {isSubscribing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Subscribing...
                      </>
                    ) : (
                      "Subscribe Now"
                    )}
                  </Button>
                )
              ) : (
                <Link href="/login?redirect=/community">
                  <Button className="bg-granite text-parchment hover:bg-slate">
                    Login to Subscribe
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Nomination Dialog */}
        <Dialog open={nominateDialogOpen} onOpenChange={setNominateDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nominate Something</DialogTitle>
              <DialogDescription>
                Suggest something for this poll. Your nomination will be reviewed before appearing in voting.
              </DialogDescription>
            </DialogHeader>

            {nominationSuccess ? (
              <div className="py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-medium text-granite mb-2">Nomination Submitted!</h3>
                <p className="text-sm text-stone">
                  Thank you! Your nomination will appear once reviewed.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom-title">Name *</Label>
                    <Input
                      id="nom-title"
                      value={nominationTitle}
                      onChange={(e) => setNominationTitle(e.target.value)}
                      placeholder="e.g., The Fisherman's Arms"
                      className="border-bone"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nom-location">Location</Label>
                    <Input
                      id="nom-location"
                      value={nominationLocation}
                      onChange={(e) => setNominationLocation(e.target.value)}
                      placeholder="e.g., Newlyn, Penzance"
                      className="border-bone"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nom-desc">Why? (optional, max 500 chars)</Label>
                    <Textarea
                      id="nom-desc"
                      value={nominationDescription}
                      onChange={(e) => setNominationDescription(e.target.value.slice(0, 500))}
                      placeholder="What makes this special?"
                      className="border-bone"
                      rows={3}
                    />
                    <p className="text-xs text-silver text-right">
                      {nominationDescription.length}/500
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setNominateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleNominate}
                    disabled={!nominationTitle.trim() || isNominating}
                    className="bg-granite text-parchment hover:bg-slate"
                  >
                    {isNominating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Nomination"
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}

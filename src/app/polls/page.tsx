"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { 
  Trophy, 
  Vote, 
  MapPin, 
  ThumbsUp,
  Loader2,
  Plus,
  CheckCircle,
  Clock,
  Crown,
  Medal,
  ExternalLink,
  Instagram,
  Facebook,
  Globe,
  ChevronRight,
  Sparkles,
  Timer,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { ShareButtons } from "@/components/ui/share-buttons";

// Category configuration
const POLL_CATEGORIES: Record<string, { emoji: string; label: string; gradient: string }> = {
  best_joke: { emoji: "😂", label: "Best Cornish Joke", gradient: "from-yellow-500 to-orange-500" },
  best_business: { emoji: "🏪", label: "Best Local Business", gradient: "from-blue-500 to-cyan-500" },
  best_pub: { emoji: "🍺", label: "Best Pub", gradient: "from-amber-600 to-yellow-500" },
  best_cafe: { emoji: "☕", label: "Best Café", gradient: "from-amber-700 to-amber-500" },
  best_restaurant: { emoji: "🍽️", label: "Best Restaurant", gradient: "from-red-500 to-pink-500" },
  best_walk: { emoji: "🥾", label: "Best Walk", gradient: "from-green-600 to-emerald-500" },
  best_beach: { emoji: "🏖️", label: "Best Beach", gradient: "from-cyan-500 to-blue-400" },
  best_kindness: { emoji: "💖", label: "Best Act of Kindness", gradient: "from-pink-500 to-rose-400" },
  best_event: { emoji: "🎉", label: "Best Event", gradient: "from-purple-500 to-pink-500" },
  best_memory: { emoji: "✨", label: "Best Memory", gradient: "from-indigo-500 to-purple-500" },
  best_site: { emoji: "🏔️", label: "Most Iconic Site", gradient: "from-slate-600 to-slate-500" },
  best_shop: { emoji: "🛍️", label: "Best Local Shop", gradient: "from-teal-500 to-green-500" },
  best_character: { emoji: "👤", label: "Most Memorable Character", gradient: "from-violet-500 to-purple-500" },
  other: { emoji: "⭐", label: "Other", gradient: "from-gray-500 to-gray-400" },
};

interface Poll {
  id: string;
  title: string;
  description: string | null;
  category: string;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  is_active: boolean;
  nominations_end_at: string | null;
  voting_start_at: string | null;
  voting_end_at: string | null;
  winner_nomination_id: string | null;
  nominations: Nomination[];
}

interface Nomination {
  id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  vote_count: number;
  user_has_voted: boolean;
  user_id: string;
  user?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface PollWinner {
  poll: Poll;
  top3: Nomination[];
}

// Countdown timer component
function CountdownTimer({ targetDate, label }: { targetDate: string; label: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate);
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      
      if (diff <= 0) return "Ended";
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft === "Ended") return null;

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium">
      <Timer className="h-3.5 w-3.5" />
      <span>{label}: {timeLeft}</span>
    </div>
  );
}

// Poll phase helper
function getPollPhase(poll: Poll): "nominations" | "voting" | "ended" {
  const now = new Date();
  if (poll.voting_end_at && new Date(poll.voting_end_at) < now) return "ended";
  if (poll.voting_start_at && new Date(poll.voting_start_at) <= now) return "voting";
  return "nominations";
}

export default function PollsPage() {
  const { user } = useAuth();
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [winners, setWinners] = useState<PollWinner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [view, setView] = useState<"active" | "hall-of-fame">("active");
  
  // Nomination dialog state
  const [nominateDialogOpen, setNominateDialogOpen] = useState(false);
  const [nominatePollId, setNominatePollId] = useState<string | null>(null);
  const [nominationData, setNominationData] = useState({
    title: "",
    description: "",
    location_name: "",
    website_url: "",
    instagram_url: "",
    facebook_url: "",
  });
  const [isNominating, setIsNominating] = useState(false);
  const [nominationSuccess, setNominationSuccess] = useState(false);

  // Category filter
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    loadPolls();
    loadWinners();
  }, [user]);

  const loadPolls = async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data: pollsData, error } = await (supabase
      .from("polls") as any)
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error || !pollsData) {
      setIsLoading(false);
      return;
    }

    // Get nominations for each poll with user info
    const pollsWithNominations = await Promise.all(
      pollsData.map(async (poll: Poll) => {
        const { data: nominations } = await (supabase
          .from("poll_nominations") as any)
          .select(`
            *,
            users:user_id (display_name, avatar_url)
          `)
          .eq("poll_id", poll.id)
          .eq("is_approved", true);

        const nominationsWithVotes = await Promise.all(
          (nominations || []).map(async (nom: any) => {
            const { count } = await (supabase
              .from("poll_votes") as any)
              .select("*", { count: "exact", head: true })
              .eq("nomination_id", nom.id);

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
              user: nom.users,
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

    setActivePolls(pollsWithNominations);
    setIsLoading(false);
  };

  const loadWinners = async () => {
    const supabase = createClient();
    const now = new Date().toISOString();

    // Get ended polls
    const { data: endedPolls, error } = await (supabase
      .from("polls") as any)
      .select("*")
      .or(`voting_end_at.lt.${now},is_active.eq.false`)
      .order("voting_end_at", { ascending: false })
      .limit(20);

    if (error || !endedPolls) return;

    const winnersData = await Promise.all(
      endedPolls.map(async (poll: Poll) => {
        const { data: nominations } = await (supabase
          .from("poll_nominations") as any)
          .select(`
            *,
            users:user_id (display_name, avatar_url)
          `)
          .eq("poll_id", poll.id)
          .eq("is_approved", true);

        const nominationsWithVotes = await Promise.all(
          (nominations || []).map(async (nom: any) => {
            const { count } = await (supabase
              .from("poll_votes") as any)
              .select("*", { count: "exact", head: true })
              .eq("nomination_id", nom.id);

            return { ...nom, user: nom.users, vote_count: count || 0, user_has_voted: false };
          })
        );

        const top3 = nominationsWithVotes
          .sort((a: Nomination, b: Nomination) => b.vote_count - a.vote_count)
          .slice(0, 3);

        return { poll: { ...poll, nominations: [] }, top3 };
      })
    );

    setWinners(winnersData.filter(w => w.top3.length > 0));
  };

  const handleVote = async (pollId: string, nominationId: string) => {
    if (!user) return;
    
    setVotingId(nominationId);
    const supabase = createClient();

    const { data: existingVote } = await (supabase
      .from("poll_votes") as any)
      .select("id, nomination_id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .single();

    if (existingVote) {
      await (supabase.from("poll_votes") as any).delete().eq("id", existingVote.id);
      if (existingVote.nomination_id === nominationId) {
        await loadPolls();
        setVotingId(null);
        return;
      }
    }

    await (supabase.from("poll_votes") as any).insert({
      poll_id: pollId,
      nomination_id: nominationId,
      user_id: user.id,
    });

    await loadPolls();
    setVotingId(null);
  };

  const openNominateDialog = (pollId: string) => {
    setNominatePollId(pollId);
    setNominationData({ title: "", description: "", location_name: "", website_url: "", instagram_url: "", facebook_url: "" });
    setNominationSuccess(false);
    setNominateDialogOpen(true);
  };

  const handleNominate = async () => {
    if (!user || !nominatePollId || !nominationData.title.trim()) return;
    
    setIsNominating(true);
    const supabase = createClient();

    const { error } = await (supabase.from("poll_nominations") as any).insert({
      poll_id: nominatePollId,
      user_id: user.id,
      title: nominationData.title.trim(),
      description: nominationData.description.trim() || null,
      location_name: nominationData.location_name.trim() || null,
      website_url: nominationData.website_url.trim() || null,
      instagram_url: nominationData.instagram_url.trim() || null,
      facebook_url: nominationData.facebook_url.trim() || null,
      is_approved: false,
    });

    if (!error) {
      setNominationSuccess(true);
      setTimeout(() => {
        setNominateDialogOpen(false);
        loadPolls();
      }, 2000);
    }
    setIsNominating(false);
  };

  const filteredPolls = categoryFilter === "all" 
    ? activePolls 
    : activePolls.filter(p => p.category === categoryFilter);

  const filteredWinners = categoryFilter === "all"
    ? winners
    : winners.filter(w => w.poll.category === categoryFilter);

  const categories = useMemo(() => {
    const all = [...activePolls.map(p => p.category), ...winners.map(w => w.poll.category)];
    return [...new Set(all)];
  }, [activePolls, winners]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 text-amber-300 text-sm font-medium mb-6">
            <Trophy className="h-4 w-4" />
            The Best of Cornwall
          </div>
          <h1 className="font-serif text-4xl md:text-6xl text-white mb-4 tracking-tight">
            Community <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">Polls</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Vote for your favourites, nominate local gems, and celebrate the best of Cornwall.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-slate-800/50 rounded-xl p-1.5 border border-slate-700">
            <button
              onClick={() => setView("active")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                view === "active"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Vote className="h-4 w-4" />
              Active Polls
              {activePolls.length > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  view === "active" ? "bg-slate-900/20 text-slate-900" : "bg-slate-700 text-slate-300"
                }`}>
                  {activePolls.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setView("hall-of-fame")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                view === "hall-of-fame"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Crown className="h-4 w-4" />
              Hall of Fame
            </button>
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex justify-center mb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  categoryFilter === "all"
                    ? "bg-white text-slate-900"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
                }`}
              >
                All
              </button>
              {categories.map(cat => {
                const catInfo = POLL_CATEGORIES[cat] || POLL_CATEGORIES.other;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      categoryFilter === cat
                        ? "bg-white text-slate-900"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
                    }`}
                  >
                    {catInfo.emoji} {catInfo.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
          </div>
        ) : view === "active" ? (
          /* Active Polls */
          <div className="space-y-8 max-w-4xl mx-auto">
            {filteredPolls.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700 text-center py-16">
                <CardContent>
                  <Vote className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="font-serif text-2xl text-white mb-2">No Active Polls</h3>
                  <p className="text-slate-400">Check back soon for new voting opportunities!</p>
                </CardContent>
              </Card>
            ) : (
              filteredPolls.map((poll) => {
                const category = POLL_CATEGORIES[poll.category] || POLL_CATEGORIES.other;
                const phase = getPollPhase(poll);

                return (
                  <Card key={poll.id} className="bg-slate-800/50 border-slate-700 overflow-hidden">
                    {/* Poll Header */}
                    <div className={`bg-gradient-to-r ${category.gradient} p-6`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-3xl">{category.emoji}</span>
                            <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                              {category.label}
                            </Badge>
                          </div>
                          <h2 className="font-serif text-2xl md:text-3xl text-white font-bold mb-2">
                            {poll.title}
                          </h2>
                          {poll.description && (
                            <p className="text-white/80 text-sm">{poll.description}</p>
                          )}
                          {poll.location_name && (
                            <div className="flex items-center gap-1.5 text-white/70 text-sm mt-2">
                              <MapPin className="h-4 w-4" />
                              {poll.location_name}
                            </div>
                          )}
                        </div>
                        <ShareButtons
                          url={`/polls#poll-${poll.id}`}
                          title={poll.title}
                          description={`Vote for the best ${category.label} in Cornwall!`}
                          variant="compact"
                          className="[&_button]:text-white/80 [&_button]:hover:text-white [&_button]:hover:bg-white/10"
                        />
                      </div>
                      
                      {/* Phase & Countdown */}
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20">
                        <Badge className={`border-0 ${
                          phase === "nominations" ? "bg-blue-500/30 text-blue-100" :
                          phase === "voting" ? "bg-green-500/30 text-green-100" :
                          "bg-gray-500/30 text-gray-100"
                        }`}>
                          {phase === "nominations" ? "📝 Nominations Open" :
                           phase === "voting" ? "🗳️ Voting Now" :
                           "✅ Ended"}
                        </Badge>
                        {phase === "nominations" && poll.nominations_end_at && (
                          <div className="text-white/70">
                            <CountdownTimer targetDate={poll.nominations_end_at} label="Nominations close" />
                          </div>
                        )}
                        {phase === "voting" && poll.voting_end_at && (
                          <div className="text-white/70">
                            <CountdownTimer targetDate={poll.voting_end_at} label="Voting ends" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nominations List */}
                    <CardContent className="p-6">
                      {poll.nominations.length === 0 ? (
                        <div className="text-center py-8">
                          <Sparkles className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400">No nominations yet. Be the first!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {poll.nominations.map((nom, index) => (
                            <div 
                              key={nom.id}
                              className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                                nom.user_has_voted 
                                  ? "bg-amber-500/10 border-2 border-amber-500/30" 
                                  : "bg-slate-700/50 border border-slate-600 hover:border-slate-500"
                              }`}
                            >
                              {/* Rank */}
                              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                                index === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900" :
                                index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-slate-900" :
                                index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" :
                                "bg-slate-600 text-slate-300"
                              }`}>
                                {index + 1}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-white truncate">{nom.title}</h4>
                                {nom.description && (
                                  <p className="text-sm text-slate-400 line-clamp-1">{nom.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1">
                                  {nom.location_name && (
                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                      <MapPin className="h-3 w-3" />
                                      {nom.location_name}
                                    </span>
                                  )}
                                  {(nom.website_url || nom.instagram_url || nom.facebook_url) && (
                                    <div className="flex items-center gap-1">
                                      {nom.website_url && (
                                        <a href={nom.website_url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-amber-400">
                                          <Globe className="h-3.5 w-3.5" />
                                        </a>
                                      )}
                                      {nom.instagram_url && (
                                        <a href={nom.instagram_url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-pink-400">
                                          <Instagram className="h-3.5 w-3.5" />
                                        </a>
                                      )}
                                      {nom.facebook_url && (
                                        <a href={nom.facebook_url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-400">
                                          <Facebook className="h-3.5 w-3.5" />
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Vote count */}
                              <div className="flex items-center gap-2 text-slate-400">
                                <ThumbsUp className={`h-5 w-5 ${nom.user_has_voted ? "fill-amber-400 text-amber-400" : ""}`} />
                                <span className="font-bold text-lg">{nom.vote_count}</span>
                              </div>

                              {/* Vote button */}
                              {phase === "voting" && (
                                user ? (
                                  <Button
                                    variant={nom.user_has_voted ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleVote(poll.id, nom.id)}
                                    disabled={votingId === nom.id}
                                    className={nom.user_has_voted 
                                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 border-0 hover:from-amber-600 hover:to-yellow-600" 
                                      : "border-slate-500 text-white hover:bg-slate-600"
                                    }
                                  >
                                    {votingId === nom.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : nom.user_has_voted ? (
                                      "Voted ✓"
                                    ) : (
                                      "Vote"
                                    )}
                                  </Button>
                                ) : (
                                  <Link href="/login">
                                    <Button variant="outline" size="sm" className="border-slate-500 text-white hover:bg-slate-600">
                                      Login to Vote
                                    </Button>
                                  </Link>
                                )
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Nominate button */}
                      {user && phase === "nominations" && (
                        <div className="mt-6 pt-4 border-t border-slate-700 text-center">
                          <Button 
                            onClick={() => openNominateDialog(poll.id)}
                            className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 hover:from-amber-600 hover:to-yellow-600"
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
          </div>
        ) : (
          /* Hall of Fame */
          <div className="space-y-8 max-w-5xl mx-auto">
            {filteredWinners.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700 text-center py-16">
                <CardContent>
                  <Trophy className="h-16 w-16 text-amber-500/50 mx-auto mb-4" />
                  <h3 className="font-serif text-2xl text-white mb-2">Hall of Fame</h3>
                  <p className="text-slate-400">Past poll winners will appear here once polls close.</p>
                </CardContent>
              </Card>
            ) : (
              filteredWinners.map((winner) => {
                const category = POLL_CATEGORIES[winner.poll.category] || POLL_CATEGORIES.other;
                const [first, second, third] = winner.top3;

                return (
                  <Card key={winner.poll.id} className="bg-slate-800/50 border-slate-700 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-b border-amber-500/30 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.emoji}</span>
                        <div className="flex-1">
                          <h3 className="font-serif text-xl text-white font-bold">{winner.poll.title}</h3>
                          {winner.poll.location_name && (
                            <p className="text-slate-400 text-sm flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {winner.poll.location_name}
                            </p>
                          )}
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                          {category.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Winners Podium */}
                    <CardContent className="p-8">
                      <div className="grid md:grid-cols-3 gap-6">
                        {/* 🥇 First Place - Large */}
                        {first && (
                          <div className="md:col-span-3 md:max-w-md md:mx-auto">
                            <div className="relative bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-amber-600/20 rounded-2xl p-8 text-center border-2 border-amber-500/50 shadow-lg shadow-amber-500/10">
                              <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                                <div className="bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-900 rounded-full p-3 shadow-lg">
                                  <Crown className="h-6 w-6" />
                                </div>
                              </div>
                              <div className="text-6xl mt-4 mb-4">🥇</div>
                              <h4 className="font-serif font-bold text-3xl text-white mb-2">{first.title}</h4>
                              {first.location_name && (
                                <p className="text-slate-400 flex items-center justify-center gap-1 mb-3">
                                  <MapPin className="h-4 w-4" />
                                  {first.location_name}
                                </p>
                              )}
                              {first.description && (
                                <p className="text-slate-300 text-sm mb-4 max-w-sm mx-auto">{first.description}</p>
                              )}
                              <p className="text-amber-400 font-bold text-2xl mb-4">
                                {first.vote_count} {first.vote_count === 1 ? "vote" : "votes"}
                              </p>
                              
                              {/* Social Links */}
                              {(first.website_url || first.instagram_url || first.facebook_url) && (
                                <div className="flex items-center justify-center gap-3 pt-4 border-t border-amber-500/30">
                                  {first.website_url && (
                                    <a href={first.website_url} target="_blank" rel="noopener noreferrer" 
                                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-700 text-white hover:bg-slate-600 transition-colors">
                                      <Globe className="h-4 w-4" />
                                      Website
                                    </a>
                                  )}
                                  {first.instagram_url && (
                                    <a href={first.instagram_url} target="_blank" rel="noopener noreferrer" 
                                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-colors">
                                      <Instagram className="h-4 w-4" />
                                      Instagram
                                    </a>
                                  )}
                                  {first.facebook_url && (
                                    <a href={first.facebook_url} target="_blank" rel="noopener noreferrer" 
                                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                                      <Facebook className="h-4 w-4" />
                                      Facebook
                                    </a>
                                  )}
                                </div>
                              )}
                              
                              {/* Winner's name */}
                              {first.user?.display_name && (
                                <p className="text-slate-500 text-sm mt-4">
                                  Nominated by {first.user.display_name}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 🥈 Second & 🥉 Third */}
                        <div className="md:col-span-3 grid md:grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
                          {second && (
                            <div className="relative bg-slate-700/50 rounded-xl p-5 text-center border border-slate-600">
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <div className="bg-gradient-to-r from-gray-300 to-gray-400 text-slate-900 rounded-full p-2 shadow">
                                  <Medal className="h-4 w-4" />
                                </div>
                              </div>
                              <div className="text-4xl mt-2 mb-3">🥈</div>
                              <h4 className="font-serif font-bold text-xl text-white mb-1">{second.title}</h4>
                              {second.location_name && (
                                <p className="text-slate-500 text-sm flex items-center justify-center gap-1 mb-2">
                                  <MapPin className="h-3 w-3" />
                                  {second.location_name}
                                </p>
                              )}
                              <p className="text-slate-400 font-semibold">
                                {second.vote_count} {second.vote_count === 1 ? "vote" : "votes"}
                              </p>
                              {(second.website_url || second.instagram_url || second.facebook_url) && (
                                <div className="flex items-center justify-center gap-2 mt-3">
                                  {second.website_url && (
                                    <a href={second.website_url} target="_blank" className="text-slate-500 hover:text-white"><Globe className="h-4 w-4" /></a>
                                  )}
                                  {second.instagram_url && (
                                    <a href={second.instagram_url} target="_blank" className="text-slate-500 hover:text-pink-400"><Instagram className="h-4 w-4" /></a>
                                  )}
                                  {second.facebook_url && (
                                    <a href={second.facebook_url} target="_blank" className="text-slate-500 hover:text-blue-400"><Facebook className="h-4 w-4" /></a>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {third && (
                            <div className="relative bg-slate-700/50 rounded-xl p-5 text-center border border-slate-600">
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-full p-2 shadow">
                                  <Medal className="h-4 w-4" />
                                </div>
                              </div>
                              <div className="text-4xl mt-2 mb-3">🥉</div>
                              <h4 className="font-serif font-bold text-xl text-white mb-1">{third.title}</h4>
                              {third.location_name && (
                                <p className="text-slate-500 text-sm flex items-center justify-center gap-1 mb-2">
                                  <MapPin className="h-3 w-3" />
                                  {third.location_name}
                                </p>
                              )}
                              <p className="text-slate-400 font-semibold">
                                {third.vote_count} {third.vote_count === 1 ? "vote" : "votes"}
                              </p>
                              {(third.website_url || third.instagram_url || third.facebook_url) && (
                                <div className="flex items-center justify-center gap-2 mt-3">
                                  {third.website_url && (
                                    <a href={third.website_url} target="_blank" className="text-slate-500 hover:text-white"><Globe className="h-4 w-4" /></a>
                                  )}
                                  {third.instagram_url && (
                                    <a href={third.instagram_url} target="_blank" className="text-slate-500 hover:text-pink-400"><Instagram className="h-4 w-4" /></a>
                                  )}
                                  {third.facebook_url && (
                                    <a href={third.facebook_url} target="_blank" className="text-slate-500 hover:text-blue-400"><Facebook className="h-4 w-4" /></a>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Nomination Dialog */}
        <Dialog open={nominateDialogOpen} onOpenChange={setNominateDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Nominate Something</DialogTitle>
              <DialogDescription className="text-slate-400">
                Suggest something for this poll. Include social links to help promote the winner!
              </DialogDescription>
            </DialogHeader>

            {nominationSuccess ? (
              <div className="py-10 text-center">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="font-medium text-white text-xl mb-2">Nomination Submitted!</h3>
                <p className="text-slate-400">
                  Thank you! Your nomination will appear once reviewed.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom-title" className="text-white">Name *</Label>
                    <Input
                      id="nom-title"
                      value={nominationData.title}
                      onChange={(e) => setNominationData({ ...nominationData, title: e.target.value })}
                      placeholder="e.g., The Fisherman's Arms"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nom-location" className="text-white">Location</Label>
                    <Input
                      id="nom-location"
                      value={nominationData.location_name}
                      onChange={(e) => setNominationData({ ...nominationData, location_name: e.target.value })}
                      placeholder="e.g., Newlyn, Penzance"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nom-desc" className="text-white">Why? (optional)</Label>
                    <Textarea
                      id="nom-desc"
                      value={nominationData.description}
                      onChange={(e) => setNominationData({ ...nominationData, description: e.target.value.slice(0, 500) })}
                      placeholder="What makes this special?"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                      rows={3}
                    />
                    <p className="text-xs text-slate-500 text-right">
                      {nominationData.description.length}/500
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <p className="text-sm text-slate-400 mb-3 flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Add links to promote this nomination if it wins:
                    </p>
                    
                    <div className="grid gap-3">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-slate-500" />
                        <Input
                          value={nominationData.website_url}
                          onChange={(e) => setNominationData({ ...nominationData, website_url: e.target.value })}
                          placeholder="https://example.com"
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-pink-400" />
                        <Input
                          value={nominationData.instagram_url}
                          onChange={(e) => setNominationData({ ...nominationData, instagram_url: e.target.value })}
                          placeholder="https://instagram.com/username"
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Facebook className="h-4 w-4 text-blue-400" />
                        <Input
                          value={nominationData.facebook_url}
                          onChange={(e) => setNominationData({ ...nominationData, facebook_url: e.target.value })}
                          placeholder="https://facebook.com/page"
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setNominateDialogOpen(false)}
                    className="border-slate-600 text-white hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleNominate}
                    disabled={!nominationData.title.trim() || isNominating}
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 hover:from-amber-600 hover:to-yellow-600"
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

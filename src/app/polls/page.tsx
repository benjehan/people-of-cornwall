"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
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
  show_nomination_location: boolean;
  allow_nomination_images: boolean;
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
  image_url: string | null;
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
    location_lat: null as number | null,
    location_lng: null as number | null,
    website_url: "",
    instagram_url: "",
    facebook_url: "",
  });
  const [nominationImage, setNominationImage] = useState<File | null>(null);
  const [nominationImagePreview, setNominationImagePreview] = useState<string | null>(null);
  const [isNominating, setIsNominating] = useState(false);
  const [nominationSuccess, setNominationSuccess] = useState(false);
  const [nominationError, setNominationError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
    setNominationData({ 
      title: "", 
      description: "", 
      location_name: "", 
      location_lat: null, 
      location_lng: null, 
      website_url: "", 
      instagram_url: "", 
      facebook_url: "" 
    });
    setNominationImage(null);
    setNominationImagePreview(null);
    setNominationSuccess(false);
    setNominationError(null);
    setNominateDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setNominationError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setNominationError("Image must be less than 5MB");
      return;
    }

    setNominationImage(file);
    setNominationImagePreview(URL.createObjectURL(file));
    setNominationError(null);
  };

  const clearImage = () => {
    setNominationImage(null);
    setNominationImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleNominate = async () => {
    if (!user || !nominatePollId || !nominationData.title.trim()) return;
    
    setIsNominating(true);
    setNominationError(null);
    const supabase = createClient();

    let imageUrl: string | null = null;

    // Upload image if provided
    if (nominationImage) {
      const fileExt = nominationImage.name.split(".").pop();
      const fileName = `nominations/${nominatePollId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("story-media")
        .upload(fileName, nominationImage, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setNominationError("Failed to upload image. Please try again.");
        setIsNominating(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("story-media")
        .getPublicUrl(fileName);
      
      imageUrl = publicUrl;
    }

    const nominationPayload: Record<string, any> = {
      poll_id: nominatePollId,
      user_id: user.id,
      title: nominationData.title.trim(),
      description: nominationData.description.trim() || null,
      location_name: nominationData.location_name.trim() || null,
      website_url: nominationData.website_url.trim() || null,
      instagram_url: nominationData.instagram_url.trim() || null,
      facebook_url: nominationData.facebook_url.trim() || null,
      image_url: imageUrl,
      is_approved: false,
    };

    // Add coordinates if available
    if (nominationData.location_lat !== null) {
      nominationPayload.location_lat = nominationData.location_lat;
    }
    if (nominationData.location_lng !== null) {
      nominationPayload.location_lng = nominationData.location_lng;
    }

    const { error } = await (supabase.from("poll_nominations") as any).insert(nominationPayload);

    if (error) {
      // Check if it's a duplicate error
      if (error.message?.includes("similar nomination")) {
        setNominationError(error.message);
      } else {
        setNominationError("Failed to submit nomination. Please try again.");
      }
      console.error("Nomination error:", error);
    } else {
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
    <div className="min-h-screen bg-parchment">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-copper/10 border border-copper/20 text-copper text-sm font-medium mb-6">
            <Trophy className="h-4 w-4" />
            The Best of Cornwall
          </div>
          <h1 className="font-serif text-4xl md:text-6xl text-granite mb-4 tracking-tight">
            Community <span className="text-copper">Polls</span>
          </h1>
          <p className="text-stone max-w-xl mx-auto text-lg">
            Vote for your favourites, nominate local gems, and celebrate the best of Cornwall.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-cream rounded-xl p-1.5 border border-bone">
            <button
              onClick={() => setView("active")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                view === "active"
                  ? "bg-granite text-parchment shadow-md"
                  : "text-stone hover:text-granite"
              }`}
            >
              <Vote className="h-4 w-4" />
              Active Polls
              {activePolls.length > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  view === "active" ? "bg-parchment/20 text-parchment" : "bg-bone text-stone"
                }`}>
                  {activePolls.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setView("hall-of-fame")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                view === "hall-of-fame"
                  ? "bg-granite text-parchment shadow-md"
                  : "text-stone hover:text-granite"
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
                    ? "bg-granite text-parchment"
                    : "bg-cream text-stone hover:bg-bone hover:text-granite border border-bone"
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
                        ? "bg-granite text-parchment"
                        : "bg-cream text-stone hover:bg-bone hover:text-granite border border-bone"
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
            <Loader2 className="h-10 w-10 animate-spin text-copper" />
          </div>
        ) : view === "active" ? (
          /* Active Polls */
          <div className="space-y-8 max-w-4xl mx-auto">
            {filteredPolls.length === 0 ? (
              <Card className="bg-cream border-bone text-center py-16">
                <CardContent>
                  <Vote className="h-16 w-16 text-stone/40 mx-auto mb-4" />
                  <h3 className="font-serif text-2xl text-granite mb-2">No Active Polls</h3>
                  <p className="text-stone">Check back soon for new voting opportunities!</p>
                </CardContent>
              </Card>
            ) : (
              filteredPolls.map((poll) => {
                const category = POLL_CATEGORIES[poll.category] || POLL_CATEGORIES.other;
                const phase = getPollPhase(poll);

                return (
                  <Card key={poll.id} className="bg-cream border-bone overflow-hidden shadow-lg" id={`poll-${poll.id}`}>
                    {/* Poll Header - using category gradient for visual interest */}
                    <div className={`bg-gradient-to-br ${category.gradient} p-6 relative overflow-hidden`}>
                      {/* Decorative background pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-black/10 translate-y-1/2 -translate-x-1/2" />
                      </div>
                      
                      <div className="relative flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-4xl drop-shadow-lg">{category.emoji}</span>
                            <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm font-medium">
                              {category.label}
                            </Badge>
                          </div>
                          <h2 className="font-serif text-2xl md:text-3xl text-white font-bold mb-2 drop-shadow-md">
                            {poll.title}
                          </h2>
                          {poll.description && (
                            <p className="text-white/90 text-sm">{poll.description}</p>
                          )}
                          {poll.location_name && (
                            <div className="flex items-center gap-1.5 text-white/80 text-sm mt-2">
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
                      <div className="relative flex items-center gap-4 mt-4 pt-4 border-t border-white/20">
                        <Badge className={`border-0 font-medium ${
                          phase === "nominations" ? "bg-white/30 text-white" :
                          phase === "voting" ? "bg-white/30 text-white" :
                          "bg-white/20 text-white/80"
                        }`}>
                          {phase === "nominations" ? "📝 Nominations Open" :
                           phase === "voting" ? "🗳️ Voting Now" :
                           "✅ Ended"}
                        </Badge>
                        {phase === "nominations" && poll.nominations_end_at && (
                          <div className="text-white/80">
                            <CountdownTimer targetDate={poll.nominations_end_at} label="Nominations close" />
                          </div>
                        )}
                        {phase === "voting" && poll.voting_end_at && (
                          <div className="text-white/80">
                            <CountdownTimer targetDate={poll.voting_end_at} label="Voting ends" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nominations List */}
                    <CardContent className="p-6">
                      {poll.nominations.length === 0 ? (
                        <div className="text-center py-8">
                          <Sparkles className="h-10 w-10 text-stone/40 mx-auto mb-3" />
                          <p className="text-stone">No nominations yet. Be the first!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {poll.nominations.map((nom, index) => (
                            <div 
                              key={nom.id}
                              className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                                nom.user_has_voted 
                                  ? "bg-copper/10 border-2 border-copper/30" 
                                  : "bg-parchment border border-bone hover:border-stone/30"
                              }`}
                            >
                              {/* Rank */}
                              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                                index === 0 ? "bg-yellow-500 text-white" :
                                index === 1 ? "bg-gray-400 text-white" :
                                index === 2 ? "bg-amber-700 text-white" :
                                "bg-bone text-stone"
                              }`}>
                                {index + 1}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-granite truncate">{nom.title}</h4>
                                {nom.description && (
                                  <p className="text-sm text-stone line-clamp-1">{nom.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1">
                                  {nom.location_name && (
                                    <span className="flex items-center gap-1 text-xs text-silver">
                                      <MapPin className="h-3 w-3" />
                                      {nom.location_name}
                                    </span>
                                  )}
                                  {(nom.website_url || nom.instagram_url || nom.facebook_url) && (
                                    <div className="flex items-center gap-1">
                                      {nom.website_url && (
                                        <a href={nom.website_url} target="_blank" rel="noopener noreferrer" className="text-silver hover:text-copper">
                                          <Globe className="h-3.5 w-3.5" />
                                        </a>
                                      )}
                                      {nom.instagram_url && (
                                        <a href={nom.instagram_url} target="_blank" rel="noopener noreferrer" className="text-silver hover:text-pink-500">
                                          <Instagram className="h-3.5 w-3.5" />
                                        </a>
                                      )}
                                      {nom.facebook_url && (
                                        <a href={nom.facebook_url} target="_blank" rel="noopener noreferrer" className="text-silver hover:text-blue-500">
                                          <Facebook className="h-3.5 w-3.5" />
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Vote count */}
                              <div className="flex items-center gap-2 text-stone">
                                <ThumbsUp className={`h-5 w-5 ${nom.user_has_voted ? "fill-copper text-copper" : ""}`} />
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
                                      ? "bg-copper text-parchment hover:bg-copper/90" 
                                      : "border-granite text-granite hover:bg-granite hover:text-parchment"
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
                                    <Button variant="outline" size="sm" className="border-granite text-granite hover:bg-granite hover:text-parchment">
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
                        <div className="mt-6 pt-4 border-t border-bone text-center">
                          <Button 
                            onClick={() => openNominateDialog(poll.id)}
                            className="gap-2 bg-granite text-parchment hover:bg-slate"
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
              <Card className="bg-cream border-bone text-center py-16">
                <CardContent>
                  <Trophy className="h-16 w-16 text-copper/50 mx-auto mb-4" />
                  <h3 className="font-serif text-2xl text-granite mb-2">Hall of Fame</h3>
                  <p className="text-stone">Past poll winners will appear here once polls close.</p>
                </CardContent>
              </Card>
            ) : (
              filteredWinners.map((winner) => {
                const category = POLL_CATEGORIES[winner.poll.category] || POLL_CATEGORIES.other;
                const [first, second, third] = winner.top3;

                return (
                  <Card key={winner.poll.id} className="bg-cream border-bone overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-copper/10 to-yellow-500/10 border-b border-copper/20 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.emoji}</span>
                        <div className="flex-1">
                          <h3 className="font-serif text-xl text-granite font-bold">{winner.poll.title}</h3>
                          {winner.poll.location_name && (
                            <p className="text-stone text-sm flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {winner.poll.location_name}
                            </p>
                          )}
                        </div>
                        <Badge className="bg-copper/10 text-copper border-copper/20">
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
                            <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-8 text-center border-2 border-yellow-400 shadow-md">
                              <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                                <div className="bg-yellow-500 text-white rounded-full p-3 shadow-lg">
                                  <Crown className="h-6 w-6" />
                                </div>
                              </div>
                              <div className="text-6xl mt-4 mb-4">🥇</div>
                              <h4 className="font-serif font-bold text-3xl text-granite mb-2">{first.title}</h4>
                              {first.location_name && (
                                <p className="text-stone flex items-center justify-center gap-1 mb-3">
                                  <MapPin className="h-4 w-4" />
                                  {first.location_name}
                                </p>
                              )}
                              {first.description && (
                                <p className="text-stone text-sm mb-4 max-w-sm mx-auto">{first.description}</p>
                              )}
                              <p className="text-yellow-700 font-bold text-2xl mb-4">
                                {first.vote_count} {first.vote_count === 1 ? "vote" : "votes"}
                              </p>
                              
                              {/* Social Links */}
                              {(first.website_url || first.instagram_url || first.facebook_url) && (
                                <div className="flex items-center justify-center gap-3 pt-4 border-t border-yellow-300">
                                  {first.website_url && (
                                    <a href={first.website_url} target="_blank" rel="noopener noreferrer" 
                                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-granite text-parchment hover:bg-slate transition-colors">
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
                                <p className="text-silver text-sm mt-4">
                                  Nominated by {first.user.display_name}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 🥈 Second & 🥉 Third */}
                        <div className="md:col-span-3 grid md:grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
                          {second && (
                            <div className="relative bg-gray-50 rounded-xl p-5 text-center border border-gray-200">
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <div className="bg-gray-400 text-white rounded-full p-2 shadow">
                                  <Medal className="h-4 w-4" />
                                </div>
                              </div>
                              <div className="text-4xl mt-2 mb-3">🥈</div>
                              <h4 className="font-serif font-bold text-xl text-granite mb-1">{second.title}</h4>
                              {second.location_name && (
                                <p className="text-stone text-sm flex items-center justify-center gap-1 mb-2">
                                  <MapPin className="h-3 w-3" />
                                  {second.location_name}
                                </p>
                              )}
                              <p className="text-gray-600 font-semibold">
                                {second.vote_count} {second.vote_count === 1 ? "vote" : "votes"}
                              </p>
                              {(second.website_url || second.instagram_url || second.facebook_url) && (
                                <div className="flex items-center justify-center gap-2 mt-3">
                                  {second.website_url && (
                                    <a href={second.website_url} target="_blank" className="text-stone hover:text-granite"><Globe className="h-4 w-4" /></a>
                                  )}
                                  {second.instagram_url && (
                                    <a href={second.instagram_url} target="_blank" className="text-stone hover:text-pink-500"><Instagram className="h-4 w-4" /></a>
                                  )}
                                  {second.facebook_url && (
                                    <a href={second.facebook_url} target="_blank" className="text-stone hover:text-blue-500"><Facebook className="h-4 w-4" /></a>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {third && (
                            <div className="relative bg-amber-50 rounded-xl p-5 text-center border border-amber-200">
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <div className="bg-amber-600 text-white rounded-full p-2 shadow">
                                  <Medal className="h-4 w-4" />
                                </div>
                              </div>
                              <div className="text-4xl mt-2 mb-3">🥉</div>
                              <h4 className="font-serif font-bold text-xl text-granite mb-1">{third.title}</h4>
                              {third.location_name && (
                                <p className="text-stone text-sm flex items-center justify-center gap-1 mb-2">
                                  <MapPin className="h-3 w-3" />
                                  {third.location_name}
                                </p>
                              )}
                              <p className="text-amber-700 font-semibold">
                                {third.vote_count} {third.vote_count === 1 ? "vote" : "votes"}
                              </p>
                              {(third.website_url || third.instagram_url || third.facebook_url) && (
                                <div className="flex items-center justify-center gap-2 mt-3">
                                  {third.website_url && (
                                    <a href={third.website_url} target="_blank" className="text-stone hover:text-granite"><Globe className="h-4 w-4" /></a>
                                  )}
                                  {third.instagram_url && (
                                    <a href={third.instagram_url} target="_blank" className="text-stone hover:text-pink-500"><Instagram className="h-4 w-4" /></a>
                                  )}
                                  {third.facebook_url && (
                                    <a href={third.facebook_url} target="_blank" className="text-stone hover:text-blue-500"><Facebook className="h-4 w-4" /></a>
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
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nominate Something</DialogTitle>
              <DialogDescription>
                Suggest something for this poll. Include social links to help promote the winner!
              </DialogDescription>
            </DialogHeader>

            {nominationSuccess ? (
              <div className="py-10 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="font-medium text-granite text-xl mb-2">Nomination Submitted!</h3>
                <p className="text-stone">
                  Thank you! Your nomination will appear once reviewed.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                  {nominationError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                      {nominationError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="nom-title">Name *</Label>
                    <Input
                      id="nom-title"
                      value={nominationData.title}
                      onChange={(e) => setNominationData({ ...nominationData, title: e.target.value })}
                      placeholder="e.g., The Fisherman's Arms"
                      className="border-bone"
                      maxLength={100}
                    />
                  </div>

                  {/* Only show location if poll allows it */}
                  {activePolls.find(p => p.id === nominatePollId)?.show_nomination_location !== false && (
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <LocationAutocomplete
                        value={nominationData.location_name}
                        onChange={(loc) => setNominationData({ 
                          ...nominationData, 
                          location_name: loc.name,
                          location_lat: loc.lat,
                          location_lng: loc.lng,
                        })}
                        placeholder="Search for a Cornish location..."
                      />
                    </div>
                  )}

                  {/* Only show image upload if poll allows it */}
                  {activePolls.find(p => p.id === nominatePollId)?.allow_nomination_images && (
                    <div className="space-y-2">
                      <Label>Photo (optional)</Label>
                      {nominationImagePreview ? (
                        <div className="relative">
                          <img 
                            src={nominationImagePreview} 
                            alt="Preview" 
                            className="w-full h-40 object-cover rounded-lg border border-bone"
                          />
                          <button
                            type="button"
                            onClick={clearImage}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow hover:bg-white"
                          >
                            <X className="h-4 w-4 text-granite" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => imageInputRef.current?.click()}
                          className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-bone rounded-lg cursor-pointer hover:border-copper hover:bg-copper/5 transition-colors"
                        >
                          <ImageIcon className="h-8 w-8 text-stone" />
                          <span className="text-sm text-stone">Click to add a photo</span>
                          <span className="text-xs text-silver">Max 5MB</span>
                        </div>
                      )}
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="nom-desc">Why? (optional)</Label>
                    <Textarea
                      id="nom-desc"
                      value={nominationData.description}
                      onChange={(e) => setNominationData({ ...nominationData, description: e.target.value.slice(0, 500) })}
                      placeholder="What makes this special?"
                      className="border-bone"
                      rows={3}
                    />
                    <p className="text-xs text-silver text-right">
                      {nominationData.description.length}/500
                    </p>
                  </div>

                  <div className="pt-4 border-t border-bone">
                    <p className="text-sm text-stone mb-3 flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Add links to promote this nomination if it wins:
                    </p>
                    
                    <div className="grid gap-3">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-stone" />
                        <Input
                          value={nominationData.website_url}
                          onChange={(e) => setNominationData({ ...nominationData, website_url: e.target.value })}
                          placeholder="https://example.com"
                          className="border-bone"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-pink-500" />
                        <Input
                          value={nominationData.instagram_url}
                          onChange={(e) => setNominationData({ ...nominationData, instagram_url: e.target.value })}
                          placeholder="https://instagram.com/username"
                          className="border-bone"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Facebook className="h-4 w-4 text-blue-500" />
                        <Input
                          value={nominationData.facebook_url}
                          onChange={(e) => setNominationData({ ...nominationData, facebook_url: e.target.value })}
                          placeholder="https://facebook.com/page"
                          className="border-bone"
                        />
                      </div>
                    </div>
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
                    disabled={!nominationData.title.trim() || isNominating}
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

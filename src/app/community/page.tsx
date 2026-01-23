"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

// Poll category icons and labels
const POLL_CATEGORIES = {
  best_joke: { icon: Laugh, label: "Best Cornish Joke", emoji: "😂" },
  best_business: { icon: Store, label: "Best Local Business", emoji: "🏪" },
  best_pub: { icon: Beer, label: "Best Pub", emoji: "🍺" },
  best_kindness: { icon: Heart, label: "Best Act of Kindness", emoji: "💖" },
  best_event: { icon: PartyPopper, label: "Best Event", emoji: "🎉" },
  best_memory: { icon: Sparkles, label: "Best Memory", emoji: "✨" },
  best_site: { icon: Mountain, label: "Most Iconic Site", emoji: "🏔️" },
  other: { icon: Star, label: "Other", emoji: "⭐" },
};

interface Poll {
  id: string;
  title: string;
  description: string | null;
  category: keyof typeof POLL_CATEGORIES;
  location_name: string | null;
  is_active: boolean;
  ends_at: string | null;
  nominations: Nomination[];
}

interface Nomination {
  id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  vote_count: number;
  user_has_voted: boolean;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);

  useEffect(() => {
    loadPolls();
  }, [user]);

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
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-granite" />
              </div>
            ) : polls.length === 0 ? (
              <Card className="border-bone bg-cream text-center py-12">
                <CardContent>
                  <Vote className="h-12 w-12 text-stone mx-auto mb-4" />
                  <h3 className="font-serif text-xl text-granite mb-2">No Active Polls</h3>
                  <p className="text-stone mb-4">
                    Check back soon for new voting opportunities!
                  </p>
                  <p className="text-sm text-silver">
                    Want to suggest a poll topic? Email us at hello@peopleofcornwall.com
                  </p>
                </CardContent>
              </Card>
            ) : (
              polls.map((poll) => {
                const category = POLL_CATEGORIES[poll.category];
                const CategoryIcon = category.icon;
                
                return (
                  <Card key={poll.id} className="border-bone bg-cream overflow-hidden">
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
                        <Badge variant="secondary" className="bg-parchment/20 text-parchment">
                          {category.emoji} {category.label}
                        </Badge>
                      </div>
                      {poll.description && (
                        <CardDescription className="text-parchment/80 mt-2">
                          {poll.description}
                        </CardDescription>
                      )}
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
                          <Button variant="ghost" className="gap-2 text-granite">
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

          {/* Winners */}
          <TabsContent value="winners">
            <Card className="border-bone bg-cream text-center py-12">
              <CardContent>
                <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="font-serif text-xl text-granite mb-2">Hall of Fame</h3>
                <p className="text-stone">
                  Past poll winners will be displayed here once polls close.
                </p>
              </CardContent>
            </Card>
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
                  Weekly Story Digest
                </h3>
                <p className="text-stone">
                  Get the 3 most popular stories of the week delivered to your inbox every Sunday.
                </p>
              </div>
              <Link href="/profile/settings">
                <Button className="bg-granite text-parchment hover:bg-slate">
                  Subscribe Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

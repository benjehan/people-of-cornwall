"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  MapPin, 
  Loader2,
  HelpCircle,
  Trophy,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  AlertTriangle,
  Send,
  Target,
  Award,
  PartyPopper,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import Image from "next/image";
import { toast } from "sonner";
import Link from "next/link";

interface Challenge {
  id: string;
  image_url: string;
  hint: string | null;
  difficulty: "easy" | "medium" | "hard";
  is_active: boolean;
  is_revealed: boolean;
  revealed_at: string | null;
  total_guesses: number;
  correct_guesses: number;
  created_at: string;
  // Only shown after reveal
  answer_location_name?: string;
  answer_description?: string;
}

interface Guess {
  id: string;
  guess_location_name: string;
  is_correct: boolean;
  distance_km: number | null;
  created_at: string;
  user?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  guest_name: string | null;
}

interface UserGuess {
  guess_location_name: string;
  is_correct: boolean;
}

const DIFFICULTY_COLORS = {
  easy: "bg-green-500/20 text-green-700 border-green-300",
  medium: "bg-yellow-500/20 text-yellow-700 border-yellow-300",
  hard: "bg-red-500/20 text-red-700 border-red-300",
};

const DIFFICULTY_LABELS = {
  easy: "🟢 Easy",
  medium: "🟡 Medium",
  hard: "🔴 Hard",
};

export default function WhereIsThisPage() {
  const { user } = useAuth();
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [pastChallenges, setPastChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [guessLocation, setGuessLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userGuess, setUserGuess] = useState<UserGuess | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultCorrect, setResultCorrect] = useState(false);
  const [allGuesses, setAllGuesses] = useState<Guess[]>([]);
  const [showGuesses, setShowGuesses] = useState(false);

  const loadChallenges = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    // Get active challenge
    const { data: active } = await (supabase
      .from("where_is_this") as any)
      .select("*")
      .eq("is_active", true)
      .single();

    if (active) {
      setActiveChallenge(active);
      
      // Check if user already guessed
      if (user) {
        const { data: existingGuess } = await (supabase
          .from("where_is_this_guesses") as any)
          .select("guess_location_name, is_correct")
          .eq("challenge_id", active.id)
          .eq("user_id", user.id)
          .single();
        
        if (existingGuess) {
          setUserGuess(existingGuess);
        }
      }
    }

    // Get past revealed challenges
    const { data: past } = await (supabase
      .from("where_is_this") as any)
      .select("*")
      .eq("is_revealed", true)
      .order("revealed_at", { ascending: false })
      .limit(10);

    setPastChallenges(past || []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const submitGuess = async () => {
    if (!activeChallenge || !guessLocation.trim()) return;
    
    setIsSubmitting(true);
    const supabase = createClient();

    const { data, error } = await (supabase
      .from("where_is_this_guesses") as any)
      .insert({
        challenge_id: activeChallenge.id,
        user_id: user?.id || null,
        guest_name: user ? null : "Anonymous",
        guess_location_name: guessLocation.trim(),
        is_correct: false, // Admin will mark correct
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        toast.error("You've already submitted a guess for this challenge!");
      } else {
        console.error("Error submitting guess:", error);
        toast.error("Failed to submit guess");
      }
    } else {
      setUserGuess({
        guess_location_name: guessLocation.trim(),
        is_correct: false,
      });
      setResultCorrect(false);
      setShowResult(true);
      setGuessLocation("");
      
      // Update total guesses count
      await (supabase
        .from("where_is_this") as any)
        .update({ total_guesses: (activeChallenge.total_guesses || 0) + 1 })
        .eq("id", activeChallenge.id);
    }
    setIsSubmitting(false);
  };

  const loadGuesses = async (challengeId: string) => {
    const supabase = createClient();
    const { data } = await (supabase
      .from("where_is_this_guesses") as any)
      .select(`
        *,
        user:users (
          display_name,
          avatar_url
        )
      `)
      .eq("challenge_id", challengeId)
      .order("created_at", { ascending: true });

    setAllGuesses(data || []);
    setShowGuesses(true);
  };

  return (
    <div className="min-h-screen bg-parchment">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-atlantic/10 text-atlantic text-sm font-medium mb-4">
            <HelpCircle className="h-4 w-4" />
            Where Is This?
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-granite mb-4">
            Can You Identify This Location?
          </h1>
          <p className="text-stone max-w-2xl mx-auto text-lg">
            Test your knowledge of Cornwall! Examine the mystery photo and guess the location.
            A new challenge appears regularly.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-granite" />
          </div>
        ) : !activeChallenge ? (
          <Card className="border-bone bg-cream text-center py-12 max-w-2xl mx-auto">
            <CardContent>
              <Clock className="h-12 w-12 text-stone mx-auto mb-4" />
              <h3 className="font-serif text-xl text-granite mb-2">No Active Challenge</h3>
              <p className="text-stone mb-4">
                A new "Where Is This?" challenge will be posted soon!
              </p>
              <p className="text-sm text-silver">
                Check out our past challenges below.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Active Challenge */
          <Card className="border-bone bg-cream overflow-hidden max-w-4xl mx-auto mb-12">
            <CardHeader className="bg-gradient-to-r from-atlantic to-granite text-parchment">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-parchment/10">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">This Week's Challenge</CardTitle>
                    <CardDescription className="text-parchment/80">
                      Can you identify where this is?
                    </CardDescription>
                  </div>
                </div>
                <Badge className={`${DIFFICULTY_COLORS[activeChallenge.difficulty]} border`}>
                  {DIFFICULTY_LABELS[activeChallenge.difficulty]}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Mystery Image */}
              <div className="relative aspect-[16/9] bg-black">
                <Image
                  src={activeChallenge.image_url}
                  alt="Mystery location"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-4 left-4">
                  <Badge className="bg-black/70 text-white border-0 text-sm">
                    <Eye className="h-4 w-4 mr-1" />
                    {activeChallenge.total_guesses} guesses
                  </Badge>
                </div>
              </div>

              {/* Hint */}
              {activeChallenge.hint && (
                <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
                  <p className="text-amber-800 text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Hint:</span> {activeChallenge.hint}
                  </p>
                </div>
              )}

              {/* Guess Section */}
              <div className="p-6">
                {userGuess ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="font-serif text-xl text-granite mb-2">Guess Submitted!</h3>
                    <p className="text-stone mb-2">
                      Your guess: <span className="font-medium text-granite">{userGuess.guess_location_name}</span>
                    </p>
                    <p className="text-sm text-silver">
                      The answer will be revealed soon. Check back later!
                    </p>
                  </div>
                ) : user ? (
                  <div className="space-y-4">
                    <Label htmlFor="guess" className="text-granite font-medium">
                      Your Guess
                    </Label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
                        <Input
                          id="guess"
                          placeholder="e.g., Porthcurno, St Ives Harbour..."
                          value={guessLocation}
                          onChange={(e) => setGuessLocation(e.target.value)}
                          className="pl-9 border-bone bg-parchment"
                          onKeyDown={(e) => e.key === "Enter" && submitGuess()}
                        />
                      </div>
                      <Button
                        onClick={submitGuess}
                        disabled={!guessLocation.trim() || isSubmitting}
                        className="bg-atlantic text-parchment hover:bg-atlantic/90"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Submit
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-silver">
                      Be as specific as possible (village name, landmark, beach name, etc.)
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-stone mb-4">Login to submit your guess!</p>
                    <Link href="/login">
                      <Button className="bg-granite text-parchment hover:bg-slate">
                        Login to Play
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Past Challenges */}
        {pastChallenges.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl text-granite mb-6 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Past Challenges
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              {pastChallenges.map((challenge) => (
                <Card 
                  key={challenge.id} 
                  className="border-bone bg-cream overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-video bg-stone/10">
                    <Image
                      src={challenge.image_url}
                      alt="Past challenge"
                      fill
                      className="object-cover"
                    />
                    <Badge className={`absolute top-2 right-2 ${DIFFICULTY_COLORS[challenge.difficulty]} border`}>
                      {DIFFICULTY_LABELS[challenge.difficulty]}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-serif font-bold text-granite flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-atlantic" />
                          {challenge.answer_location_name}
                        </h4>
                        {challenge.answer_description && (
                          <p className="text-sm text-stone mt-1 line-clamp-2">
                            {challenge.answer_description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-bone text-sm text-stone">
                      <span>{challenge.total_guesses} guesses</span>
                      <span className="text-green-600 font-medium">
                        {challenge.correct_guesses} correct
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadGuesses(challenge.id)}
                        className="text-atlantic"
                      >
                        View Guesses
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* How to Play */}
        <div className="max-w-2xl mx-auto mt-16">
          <Card className="border-atlantic/20 bg-gradient-to-r from-atlantic/5 to-granite/5">
            <CardContent className="p-8">
              <h3 className="font-serif text-xl text-granite mb-6 text-center">
                How to Play
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="w-12 h-12 rounded-full bg-atlantic/10 flex items-center justify-center mx-auto mb-3">
                    <Eye className="h-6 w-6 text-atlantic" />
                  </div>
                  <h4 className="font-medium text-granite mb-1">1. Examine</h4>
                  <p className="text-sm text-stone">Study the mystery photo carefully</p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-full bg-atlantic/10 flex items-center justify-center mx-auto mb-3">
                    <MapPin className="h-6 w-6 text-atlantic" />
                  </div>
                  <h4 className="font-medium text-granite mb-1">2. Guess</h4>
                  <p className="text-sm text-stone">Submit your location guess</p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-full bg-atlantic/10 flex items-center justify-center mx-auto mb-3">
                    <Award className="h-6 w-6 text-atlantic" />
                  </div>
                  <h4 className="font-medium text-granite mb-1">3. Win</h4>
                  <p className="text-sm text-stone">Correct guessers get recognition!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle className="text-center">
              <PartyPopper className="h-12 w-12 text-atlantic mx-auto mb-4" />
              Guess Submitted!
            </DialogTitle>
            <DialogDescription className="text-center">
              Your guess has been recorded. The answer will be revealed soon — check back later to see if you were right!
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowResult(false)} className="bg-granite text-parchment">
            Got it!
          </Button>
        </DialogContent>
      </Dialog>

      {/* Guesses Dialog */}
      <Dialog open={showGuesses} onOpenChange={setShowGuesses}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>All Guesses</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {allGuesses.map((guess, index) => (
              <div 
                key={guess.id}
                className={`p-3 rounded-lg flex items-center gap-3 ${
                  guess.is_correct 
                    ? "bg-green-50 border border-green-200" 
                    : "bg-cream border border-bone"
                }`}
              >
                <span className="text-stone font-mono text-sm w-6">{index + 1}.</span>
                <div className="flex-1">
                  <p className={`font-medium ${guess.is_correct ? "text-green-700" : "text-granite"}`}>
                    {guess.guess_location_name}
                  </p>
                  <p className="text-xs text-silver">
                    {guess.user?.display_name || guess.guest_name || "Anonymous"}
                  </p>
                </div>
                {guess.is_correct && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

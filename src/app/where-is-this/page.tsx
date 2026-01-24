"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { useUser } from "@/hooks/use-user";
import Link from "next/link";
import { CommentSection } from "@/components/comments/comment-section";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";

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
  // Answer location (used for distance calculation)
  answer_lat?: number;
  answer_lng?: number;
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
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, isLoading: authLoading } = useUser();
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [pastChallenges, setPastChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [guessLocation, setGuessLocation] = useState("");
  const [guessLat, setGuessLat] = useState<number | null>(null);
  const [guessLng, setGuessLng] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userGuess, setUserGuess] = useState<UserGuess | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultCorrect, setResultCorrect] = useState(false);
  const [allGuesses, setAllGuesses] = useState<Guess[]>([]);
  const [showGuesses, setShowGuesses] = useState(false);
  const [guessError, setGuessError] = useState<string | null>(null);
  const [selectedPastChallenge, setSelectedPastChallenge] = useState<Challenge | null>(null);

  // Temporarily admin-only while polishing
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
    }
  }, [authLoading, isAdmin, router]);

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

  // Calculate distance between two points using Haversine formula
  const calculateDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const submitGuess = async () => {
    if (!activeChallenge || !guessLocation.trim() || !guessLat || !guessLng) {
      setGuessError("Please select a location from the suggestions");
      return;
    }
    
    // Must be logged in to play
    if (!user) {
      setGuessError("Please log in to submit a guess");
      return;
    }
    
    setIsSubmitting(true);
    const supabase = createClient();

    // Calculate distance if challenge has answer coordinates
    let isCorrect = false;
    let distanceKm: number | null = null;
    
    if (activeChallenge.answer_lat && activeChallenge.answer_lng) {
      distanceKm = calculateDistanceKm(
        guessLat, 
        guessLng, 
        activeChallenge.answer_lat, 
        activeChallenge.answer_lng
      );
      // Within 2 miles (~3.2 km) counts as correct
      isCorrect = distanceKm <= 3.2;
    }

    const { data, error } = await (supabase
      .from("where_is_this_guesses") as any)
      .insert({
        challenge_id: activeChallenge.id,
        user_id: user.id,
        guess_location_name: guessLocation.trim(),
        guess_lat: guessLat,
        guess_lng: guessLng,
        distance_km: distanceKm,
        is_correct: isCorrect,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        setGuessError("You've already submitted a guess for this challenge!");
      } else {
        console.error("Error submitting guess:", error);
        setGuessError("Failed to submit guess");
      }
    } else {
      setGuessError(null);
      setUserGuess({
        guess_location_name: guessLocation.trim(),
        is_correct: isCorrect,
      });
      setResultCorrect(isCorrect);
      setShowResult(true);
      setGuessLocation("");
      setGuessLat(null);
      setGuessLng(null);
      
      // Update total guesses count (and correct count if applicable)
      const updateData: any = { 
        total_guesses: (activeChallenge.total_guesses || 0) + 1 
      };
      if (isCorrect) {
        updateData.correct_guesses = (activeChallenge.correct_guesses || 0) + 1;
      }
      await (supabase
        .from("where_is_this") as any)
        .update(updateData)
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
          <p className="text-stone max-w-2xl mx-auto text-lg mb-6">
            Test your knowledge of Cornwall! Examine the mystery photo and guess the location.
            A new challenge appears regularly.
          </p>
          {user && (
            <Link href="/where-is-this/submit">
              <Button className="bg-atlantic text-white hover:bg-atlantic/90 shadow-md">
                <Send className="h-4 w-4 mr-2" />
                Submit a Challenge
              </Button>
            </Link>
          )}
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
              <div className="relative aspect-[16/9] bg-black overflow-hidden">
                <img
                  src={activeChallenge.image_url}
                  alt="Mystery location"
                  className="absolute inset-0 w-full h-full object-cover"
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
                    {userGuess.is_correct ? (
                      <>
                        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Trophy className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-serif text-xl text-green-700 mb-2">🎉 You got it!</h3>
                        <p className="text-stone mb-2">
                          Your guess <span className="font-medium text-granite">{userGuess.guess_location_name}</span> was within 2 miles!
                        </p>
                        <Badge className="bg-green-600 text-white">Location Expert Badge Earned!</Badge>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-12 w-12 text-atlantic mx-auto mb-4" />
                        <h3 className="font-serif text-xl text-granite mb-2">Guess Submitted!</h3>
                        <p className="text-stone mb-2">
                          Your guess: <span className="font-medium text-granite">{userGuess.guess_location_name}</span>
                        </p>
                        <p className="text-sm text-silver">
                          The answer will be revealed soon. Check back to see how close you were!
                        </p>
                      </>
                    )}
                  </div>
                ) : user ? (
                  <div className="space-y-4">
                    <Label htmlFor="guess" className="text-granite font-medium">
                      Your Guess
                    </Label>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <LocationAutocomplete
                          value={guessLocation}
                          onChange={(location) => {
                            setGuessLocation(location.name);
                            setGuessLat(location.lat);
                            setGuessLng(location.lng);
                          }}
                          placeholder="Search for a location in Cornwall..."
                        />
                      </div>
                      <Button
                        onClick={submitGuess}
                        disabled={!guessLocation.trim() || !guessLat || !guessLng || isSubmitting}
                        className="bg-atlantic text-white hover:bg-atlantic/90"
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
                      Select a location from the suggestions. Guesses within 2 miles of the correct answer win!
                    </p>
                    {guessError && (
                      <p className="mt-2 text-sm text-red-600">{guessError}</p>
                    )}
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

                {/* Comments Section for Active Challenge */}
                <div className="mt-6 pt-6 border-t border-bone">
                  <CommentSection
                    contentType="where_is_this"
                    contentId={activeChallenge.id}
                    title="Discussion"
                  />
                </div>
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
                  className="border-bone bg-cream overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedPastChallenge(challenge)}
                >
                  <div className="relative aspect-video bg-stone/10 overflow-hidden">
                    <img
                      src={challenge.image_url}
                      alt="Past challenge"
                      className="absolute inset-0 w-full h-full object-cover"
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
                        onClick={(e) => {
                          e.stopPropagation();
                          loadGuesses(challenge.id);
                        }}
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

      {/* Past Challenge Detail Dialog */}
      <Dialog open={!!selectedPastChallenge} onOpenChange={(open) => !open && setSelectedPastChallenge(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedPastChallenge && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-atlantic" />
                  {selectedPastChallenge.answer_location_name}
                </DialogTitle>
                <DialogDescription>
                  Challenge revealed • {selectedPastChallenge.correct_guesses} of {selectedPastChallenge.total_guesses} guessed correctly
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Image */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-stone/10">
                  <img
                    src={selectedPastChallenge.image_url}
                    alt={selectedPastChallenge.answer_location_name || "Challenge location"}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <Badge className={`absolute top-2 right-2 ${DIFFICULTY_COLORS[selectedPastChallenge.difficulty]} border`}>
                    {DIFFICULTY_LABELS[selectedPastChallenge.difficulty]}
                  </Badge>
                </div>

                {/* Description */}
                {selectedPastChallenge.answer_description && (
                  <p className="text-stone">{selectedPastChallenge.answer_description}</p>
                )}

                {/* Stats */}
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2 text-stone">
                    <Eye className="h-4 w-4" />
                    {selectedPastChallenge.total_guesses} total guesses
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {selectedPastChallenge.correct_guesses} correct
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      loadGuesses(selectedPastChallenge.id);
                    }}
                    className="border-bone"
                  >
                    <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                    View All Guesses
                  </Button>
                </div>

                {/* Comments Section */}
                <div className="pt-4 border-t border-bone">
                  <CommentSection
                    contentType="where_is_this"
                    contentId={selectedPastChallenge.id}
                    title="Discussion"
                  />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

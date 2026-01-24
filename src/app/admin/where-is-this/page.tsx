"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HelpCircle,
  MapPin,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  Play,
  Clock,
  ArrowLeft,
  Trash2,
  Users,
  Award,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { ImageCropDialog } from "@/components/story/image-crop-dialog";

interface Challenge {
  id: string;
  image_url: string;
  hint: string | null;
  difficulty: "easy" | "medium" | "hard";
  answer_location_name: string;
  answer_description: string | null;
  answer_lat: number | null;
  answer_lng: number | null;
  is_active: boolean;
  is_revealed: boolean;
  is_pending: boolean;
  total_guesses: number;
  correct_guesses: number;
  submitter_email: string | null;
  created_at: string;
  created_by: string | null;
  user?: {
    display_name: string | null;
    email: string | null;
  } | null;
}

interface Guess {
  id: string;
  challenge_id: string;
  user_id: string | null;
  guest_name: string | null;
  guess_location_name: string;
  is_correct: boolean;
  distance_km: number | null;
  created_at: string;
  user?: {
    display_name: string | null;
    email: string | null;
  } | null;
}

const DIFFICULTY_COLORS = {
  easy: "bg-green-500/20 text-green-700",
  medium: "bg-yellow-500/20 text-yellow-700",
  hard: "bg-red-500/20 text-red-700",
};

export default function AdminWhereIsThisPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading: authLoading } = useUser();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showGuessesDialog, setShowGuessesDialog] = useState(false);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [loadingGuesses, setLoadingGuesses] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Create challenge state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    imageUrl: "",
    hint: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    answerLocationName: "",
    answerDescription: "",
    answerLat: null as number | null,
    answerLng: null as number | null,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [authLoading, user, isAdmin, router]);

  const loadChallenges = async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data, error } = await (supabase
      .from("where_is_this") as any)
      .select(`
        *,
        user:users!created_by (
          display_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading challenges:", error);
    } else {
      setChallenges(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user && isAdmin) {
      loadChallenges();
    }
  }, [user, isAdmin]);

  const loadGuesses = async (challengeId: string) => {
    setLoadingGuesses(true);
    const supabase = createClient();

    const { data, error } = await (supabase
      .from("where_is_this_guesses") as any)
      .select(`
        *,
        user:users!user_id (
          display_name,
          email
        )
      `)
      .eq("challenge_id", challengeId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setGuesses(data);
    }
    setLoadingGuesses(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }
    
    const objectUrl = URL.createObjectURL(file);
    setImageToCrop(objectUrl);
    setShowCropDialog(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "admin-challenge.jpg", { type: "image/jpeg" });
    setImageFile(croppedFile);
    setImagePreview(URL.createObjectURL(croppedBlob));
    setShowCropDialog(false);
    setImageToCrop(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return createForm.imageUrl || null;

    const supabase = createClient();
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `where-is-this/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("story-media")
      .upload(fileName, imageFile, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("story-media")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const createChallenge = async () => {
    if (!createForm.answerLocationName || !createForm.answerLat || !createForm.answerLng) {
      alert("Please select a location for the answer");
      return;
    }
    if (!imageFile && !createForm.imageUrl) {
      alert("Please upload an image or provide an image URL");
      return;
    }

    setIsCreating(true);
    try {
      const imageUrl = await uploadImage();
      if (!imageUrl) throw new Error("Failed to get image URL");

      const supabase = createClient();
      await (supabase.from("where_is_this") as any).insert({
        image_url: imageUrl,
        hint: createForm.hint || null,
        difficulty: createForm.difficulty,
        answer_location_name: createForm.answerLocationName,
        answer_description: createForm.answerDescription || null,
        answer_lat: createForm.answerLat,
        answer_lng: createForm.answerLng,
        created_by: user?.id,
        is_active: false,
        is_revealed: false,
        is_pending: false, // Admin-created, no need for approval
      });

      setShowCreateDialog(false);
      setCreateForm({
        imageUrl: "",
        hint: "",
        difficulty: "medium",
        answerLocationName: "",
        answerDescription: "",
        answerLat: null,
        answerLng: null,
      });
      setImageFile(null);
      setImagePreview(null);
      await loadChallenges();
    } catch (err) {
      console.error("Error creating challenge:", err);
      alert("Failed to create challenge");
    } finally {
      setIsCreating(false);
    }
  };

  const viewGuesses = async (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    await loadGuesses(challenge.id);
    setShowGuessesDialog(true);
  };

  const markAsCorrect = async (guess: Guess) => {
    setIsProcessing(true);
    const supabase = createClient();

    // Mark the guess as correct
    await (supabase
      .from("where_is_this_guesses") as any)
      .update({ is_correct: true })
      .eq("id", guess.id);

    // Update challenge stats
    await (supabase
      .from("where_is_this") as any)
      .update({ 
        correct_guesses: (selectedChallenge?.correct_guesses || 0) + 1 
      })
      .eq("id", guess.challenge_id);

    // Reload guesses and challenges
    if (selectedChallenge) {
      await loadGuesses(selectedChallenge.id);
    }
    await loadChallenges();
    setIsProcessing(false);
  };

  const approveChallenge = async (challenge: Challenge) => {
    setIsProcessing(true);
    const supabase = createClient();

    await (supabase
      .from("where_is_this") as any)
      .update({
        is_pending: false,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      })
      .eq("id", challenge.id);

    await loadChallenges();
    setIsProcessing(false);
  };

  const activateChallenge = async (challenge: Challenge) => {
    setIsProcessing(true);
    const supabase = createClient();

    // First, deactivate any currently active challenge
    await (supabase
      .from("where_is_this") as any)
      .update({ is_active: false })
      .eq("is_active", true);

    // Then activate this one
    await (supabase
      .from("where_is_this") as any)
      .update({ is_active: true })
      .eq("id", challenge.id);

    await loadChallenges();
    setIsProcessing(false);
  };

  const revealChallenge = async (challenge: Challenge) => {
    setIsProcessing(true);
    const supabase = createClient();

    await (supabase
      .from("where_is_this") as any)
      .update({
        is_active: false,
        is_revealed: true,
        revealed_at: new Date().toISOString(),
      })
      .eq("id", challenge.id);

    await loadChallenges();
    setIsProcessing(false);
  };

  const rejectChallenge = async () => {
    if (!selectedChallenge) return;
    setIsProcessing(true);
    const supabase = createClient();

    await (supabase
      .from("where_is_this") as any)
      .update({
        is_pending: false,
        rejection_reason: rejectReason || "Not suitable for the platform",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      })
      .eq("id", selectedChallenge.id);

    // Delete the record
    await (supabase
      .from("where_is_this") as any)
      .delete()
      .eq("id", selectedChallenge.id);

    setShowRejectDialog(false);
    setSelectedChallenge(null);
    setRejectReason("");
    await loadChallenges();
    setIsProcessing(false);
  };

  const deleteChallenge = async (challenge: Challenge) => {
    if (!confirm("Are you sure you want to delete this challenge?")) return;
    
    setIsProcessing(true);
    const supabase = createClient();

    await (supabase
      .from("where_is_this") as any)
      .delete()
      .eq("id", challenge.id);

    await loadChallenges();
    setIsProcessing(false);
  };

  const pendingChallenges = challenges.filter(c => c.is_pending);
  const approvedChallenges = challenges.filter(c => !c.is_pending && !c.is_active && !c.is_revealed);
  const activeChallenges = challenges.filter(c => c.is_active);
  const revealedChallenges = challenges.filter(c => c.is_revealed);

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-granite" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center gap-1 text-sm text-stone hover:text-granite"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Link>
            <h1 className="font-serif text-3xl text-granite">Where Is This? Management</h1>
            <p className="text-stone mt-1">Review submissions and manage challenges</p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-atlantic text-white hover:bg-atlantic/90 shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Challenge
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-granite" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Submissions */}
            {pendingChallenges.length > 0 && (
              <section>
                <h2 className="font-serif text-xl text-granite mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Pending Review ({pendingChallenges.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingChallenges.map((challenge) => (
                    <Card key={challenge.id} className="border-yellow-200 bg-yellow-50/50">
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={challenge.image_url}
                          alt="Challenge"
                          className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
                        />
                        <Badge className={`absolute top-2 right-2 ${DIFFICULTY_COLORS[challenge.difficulty]}`}>
                          {challenge.difficulty}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-atlantic font-medium">
                            <MapPin className="h-4 w-4" />
                            {challenge.answer_location_name}
                          </div>
                          {challenge.hint && (
                            <p className="text-stone">
                              <span className="font-medium">Hint:</span> {challenge.hint}
                            </p>
                          )}
                          {challenge.answer_description && (
                            <p className="text-stone line-clamp-2">{challenge.answer_description}</p>
                          )}
                          <p className="text-xs text-silver">
                            Submitted by: {challenge.user?.display_name || challenge.submitter_email || "Unknown"}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            onClick={() => approveChallenge(challenge)}
                            disabled={isProcessing}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedChallenge(challenge);
                              setShowRejectDialog(true);
                            }}
                            disabled={isProcessing}
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Active Challenge */}
            {activeChallenges.length > 0 && (
              <section>
                <h2 className="font-serif text-xl text-granite mb-4 flex items-center gap-2">
                  <Play className="h-5 w-5 text-green-500" />
                  Currently Active
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeChallenges.map((challenge) => (
                    <Card key={challenge.id} className="border-green-200 bg-green-50/50">
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={challenge.image_url}
                          alt="Challenge"
                          className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
                        />
                        <Badge className="absolute top-2 left-2 bg-green-600 text-white">
                          LIVE
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-granite flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {challenge.answer_location_name}
                        </p>
                        <p className="text-xs text-stone mt-1">
                          {challenge.total_guesses} guesses • {challenge.correct_guesses} correct
                        </p>
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewGuesses(challenge)}
                            disabled={isProcessing}
                            className="flex-1"
                          >
                            <Users className="h-4 w-4 mr-1" />
                            View Guesses
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => revealChallenge(challenge)}
                            disabled={isProcessing}
                            className="flex-1 bg-atlantic hover:bg-atlantic/90 text-white"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Reveal
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Ready to Activate */}
            {approvedChallenges.length > 0 && (
              <section>
                <h2 className="font-serif text-xl text-granite mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                  Ready to Activate ({approvedChallenges.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approvedChallenges.map((challenge) => (
                    <Card key={challenge.id} className="border-bone bg-cream">
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={challenge.image_url}
                          alt="Challenge"
                          className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
                        />
                        <Badge className={`absolute top-2 right-2 ${DIFFICULTY_COLORS[challenge.difficulty]}`}>
                          {challenge.difficulty}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-granite flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {challenge.answer_location_name}
                        </p>
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            onClick={() => activateChallenge(challenge)}
                            disabled={isProcessing || activeChallenges.length > 0}
                            className="flex-1 bg-atlantic hover:bg-atlantic/90 text-white"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            {activeChallenges.length > 0 ? "Another is active" : "Make Active"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteChallenge(challenge)}
                            disabled={isProcessing}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Past Challenges */}
            {revealedChallenges.length > 0 && (
              <section>
                <h2 className="font-serif text-xl text-granite mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-stone" />
                  Past Challenges ({revealedChallenges.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {revealedChallenges.slice(0, 8).map((challenge) => (
                    <Card 
                      key={challenge.id} 
                      className="border-bone bg-cream/50 cursor-pointer hover:border-granite/30 transition-colors"
                      onClick={() => viewGuesses(challenge)}
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={challenge.image_url}
                          alt="Challenge"
                          className="absolute inset-0 w-full h-full object-cover rounded-t-lg opacity-75"
                        />
                      </div>
                      <CardContent className="p-3">
                        <p className="text-xs font-medium text-granite truncate">
                          {challenge.answer_location_name}
                        </p>
                        <p className="text-xs text-silver">
                          {challenge.total_guesses} guesses, {challenge.correct_guesses} correct
                        </p>
                        <p className="text-xs text-atlantic mt-1">Click to view guesses →</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {challenges.length === 0 && (
              <Card className="border-bone bg-cream text-center py-12">
                <CardContent>
                  <HelpCircle className="h-12 w-12 text-stone/30 mx-auto mb-4" />
                  <h3 className="font-serif text-xl text-granite mb-2">No Challenges Yet</h3>
                  <p className="text-stone">
                    Challenges will appear here when users submit them.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Challenge</DialogTitle>
            <DialogDescription>
              This will permanently delete the challenge. Optionally provide a reason.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (optional)"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={rejectChallenge}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject & Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Guesses Dialog */}
      <Dialog open={showGuessesDialog} onOpenChange={setShowGuessesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Guesses for Challenge
            </DialogTitle>
            {selectedChallenge && (
              <DialogDescription className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Correct answer: <span className="font-medium">{selectedChallenge.answer_location_name}</span>
              </DialogDescription>
            )}
          </DialogHeader>

          {loadingGuesses ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-granite" />
            </div>
          ) : guesses.length === 0 ? (
            <p className="text-center text-stone py-8">No guesses yet for this challenge.</p>
          ) : (
            <div className="space-y-3">
              {guesses.map((guess) => (
                <div
                  key={guess.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    guess.is_correct
                      ? "bg-green-50 border-green-200"
                      : "bg-cream border-bone"
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-granite">
                      {guess.user?.display_name || guess.user?.email || guess.guest_name || "Anonymous"}
                    </p>
                    <p className="text-sm text-stone">
                      Guessed: <span className="font-medium">{guess.guess_location_name}</span>
                    </p>
                    <p className="text-xs text-silver">
                      {new Date(guess.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {guess.is_correct ? (
                      <Badge className="bg-green-600 text-white">
                        <Award className="h-3 w-3 mr-1" />
                        Winner
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => markAsCorrect(guess)}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Correct
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGuessesDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Challenge Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Challenge
            </DialogTitle>
            <DialogDescription>
              Create a new "Where Is This?" challenge for the community
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Challenge Image *</Label>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border border-bone"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => document.getElementById("admin-image-upload")?.click()}
                  className="border-2 border-dashed border-bone rounded-lg p-6 text-center cursor-pointer hover:border-atlantic transition-colors"
                >
                  <Upload className="h-8 w-8 text-stone mx-auto mb-2" />
                  <p className="text-sm text-stone">Click to upload image</p>
                </div>
              )}
              <input
                id="admin-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <p className="text-xs text-stone">Or provide an image URL:</p>
              <Input
                value={createForm.imageUrl}
                onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="border-bone"
              />
            </div>

            {/* Answer Location */}
            <div className="space-y-2">
              <Label>Correct Location *</Label>
              <LocationAutocomplete
                value={createForm.answerLocationName}
                onChange={(location) => {
                  setCreateForm({
                    ...createForm,
                    answerLocationName: location.name,
                    answerLat: location.lat,
                    answerLng: location.lng,
                  });
                }}
                placeholder="Search for the location..."
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>About this place (shown after reveal)</Label>
              <Textarea
                value={createForm.answerDescription}
                onChange={(e) => setCreateForm({ ...createForm, answerDescription: e.target.value })}
                placeholder="What makes this place special?"
                className="border-bone"
                rows={3}
              />
            </div>

            {/* Hint */}
            <div className="space-y-2">
              <Label>Hint (optional)</Label>
              <Input
                value={createForm.hint}
                onChange={(e) => setCreateForm({ ...createForm, hint: e.target.value })}
                placeholder="e.g., Near a famous lighthouse"
                className="border-bone"
              />
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={createForm.difficulty}
                onValueChange={(v) => setCreateForm({ ...createForm, difficulty: v as any })}
              >
                <SelectTrigger className="border-bone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">🟢 Easy</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="hard">🔴 Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={createChallenge}
              disabled={isCreating}
              className="bg-atlantic text-white hover:bg-atlantic/90"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Challenge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={showCropDialog && !!imageToCrop}
        onOpenChange={(open) => {
          if (!open) {
            setShowCropDialog(false);
            setImageToCrop(null);
          }
        }}
        imageSrc={imageToCrop || ""}
        onCropComplete={handleCropComplete}
        aspectRatio={16 / 9}
      />

      <Footer />
    </div>
  );
}

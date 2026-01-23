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
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

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
  const [isProcessing, setIsProcessing] = useState(false);

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
        <div className="mb-8">
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
                      <div className="relative aspect-video">
                        <Image
                          src={challenge.image_url}
                          alt="Challenge"
                          fill
                          className="object-cover rounded-t-lg"
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
                      <div className="relative aspect-video">
                        <Image
                          src={challenge.image_url}
                          alt="Challenge"
                          fill
                          className="object-cover rounded-t-lg"
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
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            onClick={() => revealChallenge(challenge)}
                            disabled={isProcessing}
                            className="flex-1 bg-atlantic hover:bg-atlantic/90 text-white"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Reveal Answer
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
                      <div className="relative aspect-video">
                        <Image
                          src={challenge.image_url}
                          alt="Challenge"
                          fill
                          className="object-cover rounded-t-lg"
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
                    <Card key={challenge.id} className="border-bone bg-cream/50">
                      <div className="relative aspect-video">
                        <Image
                          src={challenge.image_url}
                          alt="Challenge"
                          fill
                          className="object-cover rounded-t-lg opacity-75"
                        />
                      </div>
                      <CardContent className="p-3">
                        <p className="text-xs font-medium text-granite truncate">
                          {challenge.answer_location_name}
                        </p>
                        <p className="text-xs text-silver">
                          {challenge.total_guesses} guesses, {challenge.correct_guesses} correct
                        </p>
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

      <Footer />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Loader2, 
  Trash2, 
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Clock,
  MapPin,
  Trophy,
  Calendar,
  Users,
  Image as ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import Link from "next/link";

const POLL_CATEGORIES = [
  { value: "best_joke", label: "😂 Best Cornish Joke" },
  { value: "best_pub", label: "🍺 Best Pub" },
  { value: "best_cafe", label: "☕ Best Café" },
  { value: "best_restaurant", label: "🍽️ Best Restaurant" },
  { value: "best_walk", label: "🥾 Best Walk" },
  { value: "best_beach", label: "🏖️ Best Beach" },
  { value: "best_business", label: "🏪 Best Local Business" },
  { value: "best_shop", label: "🛍️ Best Local Shop" },
  { value: "best_kindness", label: "💖 Best Act of Kindness" },
  { value: "best_event", label: "🎉 Best Event" },
  { value: "best_memory", label: "✨ Best Memory" },
  { value: "best_site", label: "🏔️ Most Iconic Site" },
  { value: "best_character", label: "👤 Most Memorable Character" },
  { value: "other", label: "⭐ Other" },
];

interface Poll {
  id: string;
  title: string;
  description: string | null;
  category: string;
  location_name: string | null;
  is_active: boolean;
  created_at: string;
  nominations_end_at: string | null;
  voting_start_at: string | null;
  voting_end_at: string | null;
  winner_nomination_id: string | null;
  nomination_count?: number;
  vote_count?: number;
}

interface Nomination {
  id: string;
  poll_id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  is_approved: boolean;
  created_at: string;
  user_id: string;
  vote_count?: number;
}

// Helper to format date for datetime-local input
function formatDateForInput(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 16);
}

// Helper to get poll status
function getPollStatus(poll: Poll): { status: string; color: string; icon: React.ReactNode } {
  const now = new Date();
  
  // Winner declared = Completed (in Hall of Fame)
  if (poll.winner_nomination_id) {
    return { status: "✓ Completed", color: "bg-yellow-100 text-yellow-800", icon: <Trophy className="h-3 w-3" /> };
  }
  // Inactive but no winner = Paused/Draft
  if (!poll.is_active) {
    return { status: "Paused", color: "bg-gray-100 text-gray-600", icon: <EyeOff className="h-3 w-3" /> };
  }
  // Active poll states
  if (poll.voting_end_at && new Date(poll.voting_end_at) < now) {
    return { status: "Voting Ended", color: "bg-orange-100 text-orange-700", icon: <Clock className="h-3 w-3" /> };
  }
  if (poll.voting_start_at && new Date(poll.voting_start_at) <= now) {
    return { status: "Voting Open", color: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3 w-3" /> };
  }
  if (poll.nominations_end_at && new Date(poll.nominations_end_at) < now) {
    return { status: "Awaiting Voting", color: "bg-blue-100 text-blue-700", icon: <Clock className="h-3 w-3" /> };
  }
  return { status: "Accepting Nominations", color: "bg-emerald-100 text-emerald-700", icon: <Users className="h-3 w-3" /> };
}

export default function AdminPollsPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [nominationsDialogOpen, setNominationsDialogOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state with all fields
  const [newPoll, setNewPoll] = useState({
    title: "",
    description: "",
    category: "",
    location_name: "",
    location_lat: null as number | null,
    location_lng: null as number | null,
    nominations_end_at: "",
    voting_start_at: "",
    voting_end_at: "",
    show_nomination_location: true,
    allow_nomination_images: false,
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadPolls();
    }
  }, [isAdmin]);

  const loadPolls = async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data, error } = await (supabase
      .from("polls") as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading polls:", error);
    } else {
      // Get nomination and vote counts
      const pollsWithCounts = await Promise.all(
        (data || []).map(async (poll: Poll) => {
          const { count: nomCount } = await (supabase
            .from("poll_nominations") as any)
            .select("*", { count: "exact", head: true })
            .eq("poll_id", poll.id);
          
          const { count: voteCount } = await (supabase
            .from("poll_votes") as any)
            .select("*", { count: "exact", head: true })
            .eq("poll_id", poll.id);
            
          return { ...poll, nomination_count: nomCount || 0, vote_count: voteCount || 0 };
        })
      );
      setPolls(pollsWithCounts);
    }
    setIsLoading(false);
  };

  const createPoll = async () => {
    if (!newPoll.title.trim() || !newPoll.category) {
      setFormError("Please fill in the title and select a category");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    const supabase = createClient();

    // Build the poll data object
    const pollData: Record<string, any> = {
      title: newPoll.title.trim(),
      description: newPoll.description.trim() || null,
      category: newPoll.category,
      location_name: newPoll.location_name.trim() || null,
      show_nomination_location: newPoll.show_nomination_location,
      allow_nomination_images: newPoll.allow_nomination_images,
      is_active: true,
      created_by: user?.id,
    };

    // Only add optional fields if they have values
    if (newPoll.location_lat !== null) {
      pollData.location_lat = newPoll.location_lat;
    }
    if (newPoll.location_lng !== null) {
      pollData.location_lng = newPoll.location_lng;
    }
    if (newPoll.nominations_end_at) {
      pollData.nominations_end_at = new Date(newPoll.nominations_end_at).toISOString();
    }
    if (newPoll.voting_start_at) {
      pollData.voting_start_at = new Date(newPoll.voting_start_at).toISOString();
    }
    if (newPoll.voting_end_at) {
      pollData.voting_end_at = new Date(newPoll.voting_end_at).toISOString();
    }

    console.log("Creating poll with data:", pollData);

    const { data, error } = await (supabase.from("polls") as any)
      .insert(pollData)
      .select()
      .single();

    if (error) {
      console.error("Error creating poll:", error);
      setFormError(`Failed to create poll: ${error.message || error.details || 'Unknown error'}`);
    } else {
      console.log("Poll created successfully:", data);
      setCreateDialogOpen(false);
      setNewPoll({ 
        title: "", 
        description: "", 
        category: "", 
        location_name: "",
        location_lat: null,
        location_lng: null,
        nominations_end_at: "",
        voting_start_at: "",
        voting_end_at: "",
        show_nomination_location: true,
        allow_nomination_images: false,
      });
      await loadPolls();
    }
    setIsSubmitting(false);
  };

  const togglePollActive = async (poll: Poll) => {
    const supabase = createClient();
    await (supabase
      .from("polls") as any)
      .update({ is_active: !poll.is_active })
      .eq("id", poll.id);
    await loadPolls();
  };

  const deletePoll = async (pollId: string) => {
    if (!confirm("Are you sure? This will delete all nominations and votes.")) return;
    
    const supabase = createClient();
    await (supabase.from("polls") as any).delete().eq("id", pollId);
    await loadPolls();
  };

  const loadNominations = async (poll: Poll) => {
    setSelectedPoll(poll);
    const supabase = createClient();

    const { data } = await (supabase
      .from("poll_nominations") as any)
      .select("*")
      .eq("poll_id", poll.id)
      .order("created_at", { ascending: false });

    // Get vote counts for each nomination
    const nominationsWithVotes = await Promise.all(
      (data || []).map(async (nom: Nomination) => {
        const { count } = await (supabase
          .from("poll_votes") as any)
          .select("*", { count: "exact", head: true })
          .eq("nomination_id", nom.id);
        return { ...nom, vote_count: count || 0 };
      })
    );

    setNominations(nominationsWithVotes.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)));
    setNominationsDialogOpen(true);
  };

  const toggleNominationApproval = async (nomination: Nomination) => {
    const supabase = createClient();
    await (supabase
      .from("poll_nominations") as any)
      .update({ is_approved: !nomination.is_approved })
      .eq("id", nomination.id);

    // Refresh nominations
    if (selectedPoll) {
      await loadNominations(selectedPoll);
    }
  };

  const declareWinner = async (poll: Poll) => {
    if (!confirm("Declare the top nomination as the winner? This will close the poll.")) return;
    
    const supabase = createClient();
    
    // Find nomination with most votes
    const { data: nominations } = await (supabase
      .from("poll_nominations") as any)
      .select("id")
      .eq("poll_id", poll.id)
      .eq("is_approved", true);

    if (!nominations?.length) {
      alert("No approved nominations to declare winner from.");
      return;
    }

    // Get vote counts
    const withVotes = await Promise.all(
      nominations.map(async (nom: { id: string }) => {
        const { count } = await (supabase
          .from("poll_votes") as any)
          .select("*", { count: "exact", head: true })
          .eq("nomination_id", nom.id);
        return { id: nom.id, votes: count || 0 };
      })
    );

    const winner = withVotes.sort((a, b) => b.votes - a.votes)[0];

    await (supabase.from("polls") as any)
      .update({ 
        winner_nomination_id: winner.id, 
        is_active: false,
        winner_declared_at: new Date().toISOString(),
      })
      .eq("id", poll.id);

    await loadPolls();
  };

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-granite">Manage Polls</h1>
            <p className="text-stone mt-1">Create and manage community voting polls</p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) setFormError(null);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-granite text-parchment hover:bg-slate">
                <Plus className="h-4 w-4" />
                Create Poll
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Poll</DialogTitle>
                <DialogDescription>
                  Create a new community voting poll for "The Best of Cornwall"
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                {formError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {formError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Poll Title *</Label>
                  <Input
                    id="title"
                    value={newPoll.title}
                    onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                    placeholder="e.g., Best Pub in Falmouth 2025"
                    className="border-bone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={newPoll.category}
                    onValueChange={(value: string) => setNewPoll({ ...newPoll, category: value })}
                  >
                    <SelectTrigger className="border-bone">
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {POLL_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Location Filter (optional)</Label>
                  <LocationAutocomplete
                    value={newPoll.location_name}
                    onChange={(loc) => setNewPoll({ 
                      ...newPoll, 
                      location_name: loc.name,
                      location_lat: loc.lat,
                      location_lng: loc.lng,
                    })}
                    placeholder="Search for a Cornish location..."
                    className="border-bone"
                  />
                  <p className="text-xs text-stone">Leave empty for all of Cornwall</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-parchment border border-bone">
                    <Checkbox
                      id="show_location"
                      checked={newPoll.show_nomination_location}
                      onCheckedChange={(checked) => setNewPoll({ 
                        ...newPoll, 
                        show_nomination_location: checked === true 
                      })}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="show_location" className="font-medium cursor-pointer">
                        Show location field for nominations
                      </Label>
                      <p className="text-xs text-stone">
                        Uncheck if poll is already location-specific (e.g., "Best Pub in Falmouth") — 
                        users won't need to add a location to their nomination.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-parchment border border-bone">
                    <Checkbox
                      id="allow_images"
                      checked={newPoll.allow_nomination_images}
                      onCheckedChange={(checked) => setNewPoll({ 
                        ...newPoll, 
                        allow_nomination_images: checked === true 
                      })}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="allow_images" className="font-medium cursor-pointer flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-copper" />
                        Allow image uploads with nominations
                      </Label>
                      <p className="text-xs text-stone">
                        Enable for visual polls like "Best Sunset Spot" or "Most Scenic View" 
                        where photos enhance nominations.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={newPoll.description}
                    onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                    placeholder="What are we looking for? Any criteria?"
                    className="border-bone"
                    rows={2}
                  />
                </div>

                <div className="pt-4 border-t border-bone">
                  <h4 className="text-sm font-medium text-granite mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule (optional - leave empty for open-ended)
                  </h4>
                  
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nominations_end">Nominations End</Label>
                      <div 
                        className="relative cursor-pointer"
                        onClick={() => (document.getElementById('nominations_end') as HTMLInputElement)?.click()}
                      >
                        <Input
                          id="nominations_end"
                          type="datetime-local"
                          value={newPoll.nominations_end_at}
                          onChange={(e) => setNewPoll({ ...newPoll, nominations_end_at: e.target.value })}
                          className="border-bone cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="voting_start">Voting Starts</Label>
                      <div 
                        className="relative cursor-pointer"
                        onClick={() => (document.getElementById('voting_start') as HTMLInputElement)?.click()}
                      >
                        <Input
                          id="voting_start"
                          type="datetime-local"
                          value={newPoll.voting_start_at}
                          onChange={(e) => setNewPoll({ ...newPoll, voting_start_at: e.target.value })}
                          className="border-bone cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="voting_end">Voting Ends</Label>
                      <div 
                        className="relative cursor-pointer"
                        onClick={() => (document.getElementById('voting_end') as HTMLInputElement)?.click()}
                      >
                        <Input
                          id="voting_end"
                          type="datetime-local"
                          value={newPoll.voting_end_at}
                          onChange={(e) => setNewPoll({ ...newPoll, voting_end_at: e.target.value })}
                          className="border-bone cursor-pointer"
                        />
                      </div>
                      <p className="text-xs text-stone">Winner will be automatically declared when voting ends</p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createPoll} 
                  disabled={!newPoll.title.trim() || !newPoll.category || isSubmitting}
                  className="bg-granite text-parchment hover:bg-slate"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Poll"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Polls List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-granite" />
          </div>
        ) : polls.length === 0 ? (
          <Card className="border-bone bg-cream text-center py-12">
            <CardContent>
              <p className="text-stone">No polls created yet. Create your first poll!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {polls.map((poll) => {
              const category = POLL_CATEGORIES.find((c) => c.value === poll.category);
              const status = getPollStatus(poll);
              
              return (
                <Card key={poll.id} className="border-bone bg-cream overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      {/* Main content */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-medium text-granite text-lg">{poll.title}</h3>
                              <Badge className={`${status.color} gap-1`}>
                                {status.icon}
                                {status.status}
                              </Badge>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {category?.label || poll.category}
                            </Badge>
                          </div>
                        </div>
                        
                        {poll.description && (
                          <p className="text-sm text-stone mb-3">{poll.description}</p>
                        )}
                        
                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-stone">
                          {poll.location_name && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {poll.location_name}
                            </span>
                          )}
                          <span>{poll.nomination_count} nominations</span>
                          <span>{poll.vote_count} votes</span>
                        </div>

                        {/* Schedule */}
                        {(poll.nominations_end_at || poll.voting_start_at || poll.voting_end_at) && (
                          <div className="mt-3 pt-3 border-t border-bone flex flex-wrap gap-4 text-xs text-silver">
                            {poll.nominations_end_at && (
                              <span>Nominations end: {new Date(poll.nominations_end_at).toLocaleDateString()}</span>
                            )}
                            {poll.voting_start_at && (
                              <span>Voting starts: {new Date(poll.voting_start_at).toLocaleDateString()}</span>
                            )}
                            {poll.voting_end_at && (
                              <span>Voting ends: {new Date(poll.voting_end_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions sidebar */}
                      <div className="border-l border-bone bg-parchment p-4 flex flex-col gap-2 min-w-[140px]">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadNominations(poll)}
                          className="gap-1 justify-start"
                        >
                          <Eye className="h-4 w-4" />
                          Nominations
                        </Button>
                        
                        {/* Only show activate/deactivate if NO winner declared */}
                        {!poll.winner_nomination_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePollActive(poll)}
                            className="gap-1 justify-start"
                          >
                            {poll.is_active ? (
                              <>
                                <EyeOff className="h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4" />
                                Activate
                              </>
                            )}
                          </Button>
                        )}

                        {/* Show "Declare Winner" only if no winner yet and has nominations */}
                        {!poll.winner_nomination_id && poll.nomination_count! > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => declareWinner(poll)}
                            className="gap-1 justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <Trophy className="h-4 w-4" />
                            Declare Winner
                          </Button>
                        )}

                        {/* Show "In Hall of Fame" indicator if winner declared */}
                        {poll.winner_nomination_id && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-yellow-100 text-yellow-800 text-sm">
                            <Trophy className="h-4 w-4" />
                            In Hall of Fame
                          </div>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePoll(poll.id)}
                          className="gap-1 justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Nominations Dialog */}
        <Dialog open={nominationsDialogOpen} onOpenChange={setNominationsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nominations: {selectedPoll?.title}</DialogTitle>
              <DialogDescription>
                Approve or reject nominations. Only approved nominations appear in voting.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {nominations.length === 0 ? (
                <p className="text-center text-stone py-4">No nominations yet</p>
              ) : (
                nominations.map((nom, index) => (
                  <div
                    key={nom.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      nom.is_approved ? "border-green-200 bg-green-50" : "border-bone bg-parchment"
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 && nom.is_approved ? "bg-yellow-500 text-white" :
                      index === 1 && nom.is_approved ? "bg-gray-400 text-white" :
                      index === 2 && nom.is_approved ? "bg-amber-600 text-white" :
                      "bg-bone text-stone"
                    }`}>
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-granite">{nom.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {nom.vote_count} votes
                        </Badge>
                      </div>
                      {nom.description && (
                        <p className="text-sm text-stone">{nom.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-silver">
                        {nom.location_name && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {nom.location_name}
                          </span>
                        )}
                        {nom.website_url && <span>🔗 Website</span>}
                        {nom.instagram_url && <span>📷 Instagram</span>}
                        {nom.facebook_url && <span>📘 Facebook</span>}
                      </div>
                    </div>
                    
                    <Button
                      variant={nom.is_approved ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleNominationApproval(nom)}
                      className={nom.is_approved ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {nom.is_approved ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approved
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          Pending
                        </>
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Back link */}
        <div className="mt-8">
          <Link href="/admin" className="text-sm text-atlantic hover:underline">
            ← Back to Admin Dashboard
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

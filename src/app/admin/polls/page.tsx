"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

const POLL_CATEGORIES = [
  { value: "best_joke", label: "🤣 Best Cornish Joke" },
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
  nomination_count?: number;
}

interface Nomination {
  id: string;
  poll_id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  is_approved: boolean;
  created_at: string;
  user_id: string;
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

  // Form state
  const [newPoll, setNewPoll] = useState({
    title: "",
    description: "",
    category: "best_pub",
    location_name: "",
  });

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
      // Get nomination counts
      const pollsWithCounts = await Promise.all(
        (data || []).map(async (poll: Poll) => {
          const { count } = await (supabase
            .from("poll_nominations") as any)
            .select("*", { count: "exact", head: true })
            .eq("poll_id", poll.id);
          return { ...poll, nomination_count: count || 0 };
        })
      );
      setPolls(pollsWithCounts);
    }
    setIsLoading(false);
  };

  const createPoll = async () => {
    if (!newPoll.title.trim()) return;

    setIsSubmitting(true);
    const supabase = createClient();

    const { error } = await (supabase.from("polls") as any).insert({
      title: newPoll.title.trim(),
      description: newPoll.description.trim() || null,
      category: newPoll.category,
      location_name: newPoll.location_name.trim() || null,
      is_active: true,
      created_by: user?.id,
    });

    if (error) {
      console.error("Error creating poll:", error);
    } else {
      setCreateDialogOpen(false);
      setNewPoll({ title: "", description: "", category: "best_pub", location_name: "" });
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

    setNominations(data || []);
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
      const { data } = await (supabase
        .from("poll_nominations") as any)
        .select("*")
        .eq("poll_id", selectedPoll.id)
        .order("created_at", { ascending: false });
      setNominations(data || []);
    }
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
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-granite text-parchment hover:bg-slate">
                <Plus className="h-4 w-4" />
                Create Poll
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Poll</DialogTitle>
                <DialogDescription>
                  Create a new community voting poll for "The Best of Cornwall"
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Poll Title</Label>
                  <Input
                    id="title"
                    value={newPoll.title}
                    onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                    placeholder="e.g., Best Pub in Falmouth"
                    className="border-bone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newPoll.category}
                    onValueChange={(value: string) => setNewPoll({ ...newPoll, category: value })}
                  >
                    <SelectTrigger className="border-bone">
                      <SelectValue />
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
                  <Label htmlFor="location">Location (optional)</Label>
                  <Input
                    id="location"
                    value={newPoll.location_name}
                    onChange={(e) => setNewPoll({ ...newPoll, location_name: e.target.value })}
                    placeholder="e.g., Falmouth, Truro, All of Cornwall"
                    className="border-bone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={newPoll.description}
                    onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                    placeholder="What are we looking for? Any criteria?"
                    className="border-bone"
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createPoll} 
                  disabled={!newPoll.title.trim() || isSubmitting}
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
              return (
                <Card key={poll.id} className="border-bone bg-cream">
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-granite">{poll.title}</h3>
                        <Badge variant={poll.is_active ? "default" : "secondary"}>
                          {poll.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">{category?.label || poll.category}</Badge>
                      </div>
                      {poll.description && (
                        <p className="text-sm text-stone mb-1">{poll.description}</p>
                      )}
                      <p className="text-xs text-silver">
                        {poll.nomination_count} nominations • Created {new Date(poll.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadNominations(poll)}
                        className="gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Nominations
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePollActive(poll)}
                        className="gap-1"
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePoll(poll.id)}
                        className="gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
              <DialogTitle>Nominations for: {selectedPoll?.title}</DialogTitle>
              <DialogDescription>
                Approve or reject nominations. Only approved nominations appear in voting.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {nominations.length === 0 ? (
                <p className="text-center text-stone py-4">No nominations yet</p>
              ) : (
                nominations.map((nom) => (
                  <div
                    key={nom.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      nom.is_approved ? "border-green-200 bg-green-50" : "border-bone bg-parchment"
                    }`}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-granite">{nom.title}</h4>
                      {nom.description && (
                        <p className="text-sm text-stone">{nom.description}</p>
                      )}
                      {nom.location_name && (
                        <p className="text-xs text-silver mt-1">📍 {nom.location_name}</p>
                      )}
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

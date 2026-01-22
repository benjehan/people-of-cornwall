"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Star, StarOff, Trash2, Edit, Sparkles, Eye, EyeOff } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";

interface Prompt {
  id: string;
  title: string;
  body: string;
  active: boolean;
  featured: boolean;
  created_at: string;
  story_count?: number;
}

export default function AdminPromptsPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading } = useUser();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [promptTitle, setPromptTitle] = useState("");
  const [promptDescription, setPromptDescription] = useState("");

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [isLoading, user, isAdmin, router]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    fetchPrompts();
  }, [user, isAdmin]);

  const fetchPrompts = async () => {
    const supabase = createClient();
    const { data, error } = await (supabase
      .from("prompts") as any)
      .select("*, stories(count)")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching prompts:", error);
    } else {
      // Compute story_count from the stories relationship
      const promptsWithCount = (data || []).map((p: any) => ({
        ...p,
        story_count: Array.isArray(p.stories) ? p.stories[0]?.count || 0 : 0,
      }));
      setPrompts(promptsWithCount as Prompt[]);
    }
    setLoadingPrompts(false);
  };

  const openCreateDialog = () => {
    setEditingPrompt(null);
    setPromptTitle("");
    setPromptDescription("");
    setDialogOpen(true);
  };

  const openEditDialog = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setPromptTitle(prompt.title);
    setPromptDescription(prompt.body || "");
    setDialogOpen(true);
  };

  const handleSavePrompt = () => {
    if (!promptTitle.trim()) return;

    startTransition(async () => {
      const supabase = createClient();

      if (editingPrompt) {
        await (supabase.from("prompts") as any)
          .update({
            title: promptTitle.trim(),
            body: promptDescription.trim(),
          })
          .eq("id", editingPrompt.id);
      } else {
        await (supabase.from("prompts") as any)
          .insert({
            title: promptTitle.trim(),
            body: promptDescription.trim(),
            active: true,
            featured: false,
          });
      }

      setDialogOpen(false);
      fetchPrompts();
    });
  };

  const toggleActive = (prompt: Prompt) => {
    startTransition(async () => {
      const supabase = createClient();
      await (supabase.from("prompts") as any)
        .update({ active: !prompt.active })
        .eq("id", prompt.id);
      fetchPrompts();
    });
  };

  const toggleFeatured = (prompt: Prompt) => {
    startTransition(async () => {
      const supabase = createClient();
      
      // If making this one featured, unfeatured all others first
      if (!prompt.featured) {
        await (supabase.from("prompts") as any)
          .update({ featured: false })
          .neq("id", prompt.id);
      }
      
      await (supabase.from("prompts") as any)
        .update({ featured: !prompt.featured })
        .eq("id", prompt.id);
      fetchPrompts();
    });
  };

  const deletePrompt = (promptId: string) => {
    if (!confirm("Delete this prompt? Stories linked to it will remain but won't be associated with any prompt.")) return;

    startTransition(async () => {
      const supabase = createClient();
      await (supabase.from("prompts") as any).delete().eq("id", promptId);
      fetchPrompts();
    });
  };

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-parchment">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-granite border-t-transparent" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1 py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Back link */}
          <Link
            href="/admin"
            className="mb-6 inline-flex items-center gap-1 text-sm text-stone hover:text-granite transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-copper" />
              <div>
                <h1 className="font-serif text-3xl font-bold tracking-tight text-granite">Prompts</h1>
                <p className="text-stone">
                  Manage community writing prompts.
                </p>
              </div>
            </div>
            <Button onClick={openCreateDialog} className="gap-2 bg-granite text-parchment hover:bg-slate">
              <Plus className="h-4 w-4" />
              New Prompt
            </Button>
          </div>

          {/* Prompts List */}
          {loadingPrompts ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-granite border-t-transparent" />
            </div>
          ) : prompts.length > 0 ? (
            <div className="space-y-4">
              {prompts.map((prompt) => (
                <Card key={prompt.id} className={`border-bone ${prompt.active ? "bg-cream" : "bg-cream/50"}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {prompt.featured && (
                            <Badge className="bg-copper/10 text-copper border-0">
                              <Star className="mr-1 h-3 w-3 fill-current" />
                              Featured
                            </Badge>
                          )}
                          {!prompt.active && (
                            <Badge className="bg-stone/10 text-stone border-0">
                              Inactive
                            </Badge>
                          )}
                        </div>

                        <h3 className={`mb-2 font-serif text-xl font-bold ${prompt.active ? "text-granite" : "text-stone"}`}>
                          "{prompt.title}"
                        </h3>

                        {prompt.body && (
                          <p className="text-sm text-stone mb-2">
                            {prompt.body}
                          </p>
                        )}

                        <p className="text-xs text-silver">
                          {prompt.story_count || 0} {(prompt.story_count || 0) === 1 ? "story" : "stories"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(prompt)}
                          disabled={isPending}
                          title={prompt.active ? "Deactivate" : "Activate"}
                        >
                          {prompt.active ? (
                            <EyeOff className="h-4 w-4 text-stone" />
                          ) : (
                            <Eye className="h-4 w-4 text-granite" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFeatured(prompt)}
                          disabled={isPending || !prompt.active}
                          className={prompt.featured ? "text-copper" : "text-stone"}
                          title={prompt.featured ? "Remove featured" : "Make featured"}
                        >
                          {prompt.featured ? (
                            <StarOff className="h-4 w-4" />
                          ) : (
                            <Star className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(prompt)}
                          disabled={isPending}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePrompt(prompt.id)}
                          disabled={isPending}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-bone">
              <CardContent className="py-16 text-center">
                <Sparkles className="mx-auto mb-4 h-12 w-12 text-stone/30" />
                <p className="text-stone">No prompts yet.</p>
                <Button onClick={openCreateDialog} className="mt-4 bg-granite text-parchment hover:bg-slate">
                  Create your first prompt
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingPrompt ? "Edit Prompt" : "Create New Prompt"}
            </DialogTitle>
            <DialogDescription>
              Prompts inspire community members to share their stories.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-granite">
                Prompt Question
              </label>
              <Input
                value={promptTitle}
                onChange={(e) => setPromptTitle(e.target.value)}
                placeholder="e.g. What was market day like in your town?"
                className="border-bone"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-granite">
                Description (optional)
              </label>
              <Textarea
                value={promptDescription}
                onChange={(e) => setPromptDescription(e.target.value)}
                placeholder="Additional context or guidance for writers..."
                rows={3}
                className="border-bone"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-granite text-granite">
              Cancel
            </Button>
            <Button
              onClick={handleSavePrompt}
              disabled={isPending || !promptTitle.trim()}
              className="bg-granite text-parchment hover:bg-slate"
            >
              {editingPrompt ? "Save Changes" : "Create Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

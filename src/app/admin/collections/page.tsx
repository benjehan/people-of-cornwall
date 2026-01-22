"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, Plus, Pencil, Trash2, Folder, Eye, BookOpen } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";

interface Collection {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  created_at: string;
  story_count?: number;
}

export default function AdminCollectionsPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading, profileChecked } = useUser();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [isPending, startTransition] = useTransition();

  // New/Edit collection form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!isLoading && profileChecked && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [isLoading, profileChecked, user, isAdmin, router]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    fetchCollections();
  }, [user, isAdmin]);

  const fetchCollections = async () => {
    const supabase = createClient();
    const { data } = await (supabase
      .from("collections") as any)
      .select("*, story_collections(count)")
      .order("title");

    if (data) {
      setCollections(
        data.map((c: any) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          description: c.description,
          created_at: c.created_at,
          story_count: Array.isArray(c.story_collections)
            ? c.story_collections[0]?.count || 0
            : 0,
        }))
      );
    }
    setLoadingCollections(false);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSave = () => {
    if (!title.trim()) return;

    startTransition(async () => {
      const supabase = createClient();
      const slug = generateSlug(title);

      if (editingId) {
        // Update
        await (supabase
          .from("collections") as any)
          .update({ title, slug, description: description || null })
          .eq("id", editingId);
      } else {
        // Create
        await (supabase.from("collections") as any).insert({
          title,
          slug,
          description: description || null,
        });
      }

      setIsDialogOpen(false);
      setEditingId(null);
      setTitle("");
      setDescription("");
      fetchCollections();
    });
  };

  const handleEdit = (collection: Collection) => {
    setEditingId(collection.id);
    setTitle(collection.title);
    setDescription(collection.description || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this collection? Stories will not be deleted.")) return;

    const supabase = createClient();
    await (supabase.from("collections") as any).delete().eq("id", id);
    fetchCollections();
  };

  const openNewDialog = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setIsDialogOpen(true);
  };

  if (isLoading || !profileChecked || !user || !isAdmin) {
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
              <Folder className="h-6 w-6 text-granite" />
              <div>
                <h1 className="font-serif text-3xl font-bold tracking-tight text-granite">Collections</h1>
                <p className="text-stone">
                  Organize stories into themed collections for your digital museum.
                </p>
              </div>
            </div>
            <Button
              onClick={openNewDialog}
              className="gap-2 bg-granite text-parchment hover:bg-slate"
            >
              <Plus className="h-4 w-4" />
              New Collection
            </Button>
          </div>

          {/* Info box */}
          <Card className="mb-8 border-granite/20 bg-granite/5">
            <CardContent className="py-4">
              <p className="text-sm text-granite">
                <strong>How collections work:</strong> Create collections here, then go to{" "}
                <Link href="/admin/stories" className="underline hover:text-slate">
                  All Stories
                </Link>{" "}
                to add stories to your collections using the folder icon on each story.
              </p>
            </CardContent>
          </Card>

          {/* Collections List */}
          {loadingCollections ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-granite border-t-transparent" />
            </div>
          ) : collections.length > 0 ? (
            <div className="space-y-4">
              {collections.map((collection) => (
                <Card key={collection.id} className="border-bone bg-cream">
                  <CardContent className="flex items-center justify-between py-5">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="rounded-full bg-granite/10 p-3">
                        <BookOpen className="h-5 w-5 text-granite" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-serif font-bold text-lg text-granite truncate">
                            {collection.title}
                          </h3>
                          <Badge variant="outline" className="border-bone text-stone text-xs">
                            {collection.story_count || 0} stories
                          </Badge>
                        </div>
                        {collection.description && (
                          <p className="text-sm text-stone line-clamp-1">
                            {collection.description}
                          </p>
                        )}
                        <p className="text-xs text-silver mt-1">
                          /collections/{collection.slug}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/collections/${collection.slug}`}>
                        <Button variant="ghost" size="sm" className="gap-1 text-stone hover:text-granite">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(collection)}
                        className="gap-1 text-granite"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(collection.id)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-bone">
              <CardContent className="py-16 text-center">
                <Folder className="mx-auto mb-4 h-12 w-12 text-stone/30" />
                <h3 className="mb-2 font-serif text-xl font-bold text-granite">No collections yet</h3>
                <p className="mb-6 text-stone">
                  Collections are the treasure chests of your digital museum.
                </p>
                <Button onClick={openNewDialog} className="bg-granite text-parchment hover:bg-slate">
                  Create your first collection
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingId ? "Edit Collection" : "New Collection"}
            </DialogTitle>
            <DialogDescription>
              Collections help organize stories by theme, place, or time period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Fishing Stories, Mining Memories, 1950s Cornwall"
                className="border-bone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What stories belong in this collection? What's the theme?"
                rows={3}
                className="border-bone"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-granite text-granite">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || !title.trim()}
              className="bg-granite text-parchment hover:bg-slate"
            >
              {isPending ? "Saving..." : editingId ? "Save Changes" : "Create Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

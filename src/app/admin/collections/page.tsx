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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, Folder } from "lucide-react";
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

  // New collection form state
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
    const { data } = await supabase
      .from("collections")
      .select("*, story_collections(count)")
      .order("title");

    if (data) {
      setCollections(
        data.map((c) => ({
          ...c,
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
        await supabase
          .from("collections")
          .update({ title, slug, description: description || null })
          .eq("id", editingId);
      } else {
        // Create
        await supabase.from("collections").insert({
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
    await supabase.from("collections").delete().eq("id", id);
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
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-atlantic-blue border-t-transparent" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-chalk-white">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-4xl px-4">
          {/* Back link */}
          <Link
            href="/admin"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 font-serif text-3xl font-semibold">Collections</h1>
              <p className="text-muted-foreground">
                Manage themed collections of stories.
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={openNewDialog}
                  className="gap-2 bg-atlantic-blue text-chalk-white hover:bg-atlantic-blue-light"
                >
                  <Plus className="h-4 w-4" />
                  New Collection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit Collection" : "New Collection"}
                  </DialogTitle>
                  <DialogDescription>
                    Collections help organize stories by theme.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Fishing Stories"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What stories belong in this collection?"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isPending || !title.trim()}
                    className="bg-atlantic-blue text-chalk-white hover:bg-atlantic-blue-light"
                  >
                    {isPending ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Collections List */}
          {loadingCollections ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-atlantic-blue border-t-transparent" />
            </div>
          ) : collections.length > 0 ? (
            <div className="space-y-4">
              {collections.map((collection) => (
                <Card key={collection.id} className="border-chalk-white-dark">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-atlantic-blue/10 p-2">
                        <Folder className="h-5 w-5 text-atlantic-blue" />
                      </div>
                      <div>
                        <h3 className="font-medium">{collection.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {collection.story_count || 0} stories • /{collection.slug}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(collection)}
                        className="gap-1"
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
            <Card className="border-dashed border-chalk-white-dark">
              <CardContent className="py-12 text-center">
                <Folder className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="mb-4 text-muted-foreground">No collections yet</p>
                <Button onClick={openNewDialog} variant="outline">
                  Create your first collection
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

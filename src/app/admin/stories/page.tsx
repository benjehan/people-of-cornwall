"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Star,
  StarOff,
  Eye,
  Folder,
  FolderPlus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { adminDeleteStoryAction } from "@/app/actions/stories";

interface StoryCollection {
  collection_id: string;
  collections: {
    id: string;
    title: string;
  };
}

interface Story {
  id: string;
  title: string;
  author_display_name: string | null;
  status: string;
  featured: boolean;
  created_at: string;
  published_at: string | null;
  deletion_requested?: boolean;
  story_collections?: StoryCollection[];
}

interface Collection {
  id: string;
  title: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  review: "bg-amber-100 text-amber-700",
  published: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  unpublished: "bg-slate-100 text-slate-700",
};

export default function AdminStoriesPage() {
  const router = useRouter();
  const { user, isAdmin, isModerator, isLoading } = useUser();
  const [stories, setStories] = useState<Story[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  // Add to collection dialog
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");

  useEffect(() => {
    if (!isLoading && (!user || !isModerator)) {
      router.push("/");
    }
  }, [isLoading, user, isModerator, router]);

  useEffect(() => {
    if (!user || !isModerator) return;
    fetchStories();
    fetchCollections();
  }, [user, isModerator, statusFilter]);

  const fetchStories = async () => {
    const supabase = createClient();
    let query = (supabase
      .from("stories") as any)
      .select(`
        id, title, author_display_name, status, featured, created_at, published_at, deletion_requested,
        story_collections(collection_id, collections(id, title))
      `)
      .eq("soft_deleted", false)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setStories((data as Story[]) || []);
    setLoadingStories(false);
  };

  const handleAdminDelete = (storyId: string) => {
    if (!confirm("Delete this story? This action cannot be undone.")) return;
    
    startTransition(async () => {
      await adminDeleteStoryAction(storyId);
      fetchStories();
    });
  };

  const fetchCollections = async () => {
    const supabase = createClient();
    const { data } = await (supabase.from("collections") as any).select("id, title").order("title");
    setCollections((data as Collection[]) || []);
  };

  const toggleFeatured = (storyId: string, currentFeatured: boolean) => {
    startTransition(async () => {
      const supabase = createClient();
      await (supabase.from("stories") as any).update({ featured: !currentFeatured }).eq("id", storyId);
      fetchStories();
    });
  };

  const openCollectionDialog = (storyId: string) => {
    setSelectedStoryId(storyId);
    setSelectedCollectionId("");
    setCollectionDialogOpen(true);
  };

  const addToCollection = () => {
    if (!selectedStoryId || !selectedCollectionId) return;

    startTransition(async () => {
      const supabase = createClient();
      await (supabase.from("story_collections") as any).upsert({
        story_id: selectedStoryId,
        collection_id: selectedCollectionId,
      });
      setCollectionDialogOpen(false);
      setSelectedStoryId(null);
    });
  };

  if (isLoading || !user || !isModerator) {
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
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Back link */}
          <Link
            href="/admin"
            className="mb-6 inline-flex items-center gap-1 text-sm text-stone hover:text-granite transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="mb-2 font-serif text-3xl font-bold tracking-tight text-granite">All Stories</h1>
              <p className="text-stone">
                Manage stories, featuring, and collections.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-md border border-bone bg-parchment px-3 text-sm text-granite focus:border-granite focus:outline-none"
              >
                <option value="all">All statuses</option>
                <option value="draft">Drafts</option>
                <option value="review">In Review</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Stories List */}
          {loadingStories ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-granite border-t-transparent" />
            </div>
          ) : stories.length > 0 ? (
            <div className="space-y-3">
              {stories.map((story) => (
                <Card key={story.id} className="border-bone bg-cream">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-serif font-bold text-granite truncate">{story.title || "Untitled"}</h3>
                        <Badge className={STATUS_COLORS[story.status] || ""}>
                          {story.status}
                        </Badge>
                        {story.featured && (
                          <Badge className="bg-copper/10 text-copper border-0">
                            <Star className="mr-1 h-3 w-3 fill-current" />
                            Featured
                          </Badge>
                        )}
                        {story.deletion_requested && (
                          <Badge className="bg-red-100 text-red-700">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Deletion
                          </Badge>
                        )}
                        {story.story_collections && story.story_collections.length > 0 && (
                          <Badge className="bg-green-100 text-green-700 border-0">
                            <Folder className="mr-1 h-3 w-3" />
                            {story.story_collections.map(sc => sc.collections?.title).filter(Boolean).join(", ")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-stone">
                        by {story.author_display_name || "Anonymous"} •{" "}
                        {new Date(story.created_at).toLocaleDateString("en-GB")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/stories/${story.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>

                      {story.status === "published" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFeatured(story.id, story.featured)}
                            disabled={isPending}
                            className={story.featured ? "text-slate" : "text-stone hover:text-slate"}
                            title={story.featured ? "Remove from featured" : "Feature this story"}
                          >
                            {story.featured ? (
                              <StarOff className="h-4 w-4" />
                            ) : (
                              <Star className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCollectionDialog(story.id)}
                            className={story.story_collections && story.story_collections.length > 0 
                              ? "text-green-600 hover:text-green-700" 
                              : "text-stone hover:text-slate"}
                            title={story.story_collections && story.story_collections.length > 0
                              ? `In: ${story.story_collections.map(sc => sc.collections?.title).filter(Boolean).join(", ")}`
                              : "Add to collection"}
                          >
                            {story.story_collections && story.story_collections.length > 0 ? (
                              <Folder className="h-4 w-4 fill-current" />
                            ) : (
                              <FolderPlus className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAdminDelete(story.id)}
                        disabled={isPending}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Delete story"
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
              <CardContent className="py-12 text-center">
                <p className="text-stone">
                  No stories found with the selected filter.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Add to Collection Dialog */}
      <Dialog open={collectionDialogOpen} onOpenChange={setCollectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Add to Collection</DialogTitle>
            <DialogDescription>
              Choose a collection to add this story to.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {collections.length > 0 ? (
              <select
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
                className="w-full h-10 rounded-md border border-bone bg-parchment px-3 text-sm text-granite focus:border-granite focus:outline-none"
              >
                <option value="">Select a collection...</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-stone">
                No collections yet.{" "}
                <Link href="/admin/collections" className="text-granite font-medium hover:text-slate">
                  Create one first.
                </Link>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCollectionDialogOpen(false)} className="border-granite text-granite hover:bg-granite hover:text-parchment">
              Cancel
            </Button>
            <Button
              onClick={addToCollection}
              disabled={isPending || !selectedCollectionId}
              className="bg-granite text-parchment hover:bg-slate"
            >
              Add to Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

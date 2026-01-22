"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  PenLine,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  AlertTriangle,
  Undo2,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { deleteStoryAction, requestDeletionAction, cancelDeletionRequestAction } from "@/app/actions/stories";
import type { Tables } from "@/types/supabase";

type Story = Tables<"stories">;

const STATUS_CONFIG = {
  draft: { label: "Draft", icon: FileText, color: "bg-slate-grey/10 text-slate-grey" },
  review: { label: "In Review", icon: Clock, color: "bg-atlantic-blue/10 text-atlantic-blue" },
  published: { label: "Published", icon: CheckCircle, color: "bg-moss-green/10 text-moss-green" },
  rejected: { label: "Needs Changes", icon: XCircle, color: "bg-copper-clay/10 text-copper-clay" },
  unpublished: { label: "Unpublished", icon: Eye, color: "bg-slate-grey/10 text-slate-grey" },
};

function MyStoriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useUser();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const submitted = searchParams.get("submitted");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/profile/stories");
    }
  }, [authLoading, user, router]);

  const fetchStories = async () => {
    if (!user) return;
    
    const supabase = createClient();
    const { data, error } = await (supabase
      .from("stories") as any)
      .select("*")
      .eq("author_id", user.id)
      .eq("soft_deleted", false)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching stories:", error);
    } else {
      setStories((data as Story[]) || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchStories();
  }, [user]);

  const filteredStories = stories.filter((story) => {
    if (activeTab === "all") return true;
    return story.status === activeTab;
  });

  const counts = {
    all: stories.length,
    draft: stories.filter((s) => s.status === "draft").length,
    review: stories.filter((s) => s.status === "review").length,
    published: stories.filter((s) => s.status === "published").length,
    rejected: stories.filter((s) => s.status === "rejected").length,
  };

  if (authLoading || !user) {
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
            href="/profile"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to profile
          </Link>

          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-1 font-serif text-3xl font-semibold">My Stories</h1>
              <p className="text-muted-foreground">
                Manage your drafts, submissions, and published stories.
              </p>
            </div>
            <Link href="/write">
              <Button className="gap-2 bg-copper-clay text-chalk-white hover:bg-copper-clay-light">
                <PenLine className="h-4 w-4" />
                New story
              </Button>
            </Link>
          </div>

          {/* Success message */}
          {submitted && (
            <Card className="mb-6 border-moss-green/30 bg-moss-green/10">
              <CardContent className="flex items-center gap-3 py-4">
                <CheckCircle className="h-5 w-5 text-moss-green" />
                <p className="text-sm text-moss-green-dark">
                  Your story has been sent for review. We'll notify you when it's published.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 w-full justify-start">
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="draft">Drafts ({counts.draft})</TabsTrigger>
              <TabsTrigger value="review">In Review ({counts.review})</TabsTrigger>
              <TabsTrigger value="published">Published ({counts.published})</TabsTrigger>
              {counts.rejected > 0 && (
                <TabsTrigger value="rejected">Needs Changes ({counts.rejected})</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-atlantic-blue border-t-transparent" />
                </div>
              ) : filteredStories.length === 0 ? (
                <Card className="border-chalk-white-dark">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mb-2 text-lg font-medium">No stories yet</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      {activeTab === "all"
                        ? "Start sharing your memories of Cornwall."
                        : `You don't have any ${activeTab} stories.`}
                    </p>
                    <Link href="/write">
                      <Button className="gap-2 bg-atlantic-blue text-chalk-white hover:bg-atlantic-blue-light">
                        <PenLine className="h-4 w-4" />
                        Share your first story
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredStories.map((story) => (
                    <StoryCard key={story.id} story={story} onRefresh={fetchStories} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function MyStoriesPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-atlantic-blue border-t-transparent" />
        </main>
      </div>
    }>
      <MyStoriesContent />
    </Suspense>
  );
}

interface StoryCardProps {
  story: Story & { deletion_requested?: boolean; deletion_reason?: string | null };
  onRefresh: () => void;
}

function StoryCard({ story, onRefresh }: StoryCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  const statusConfig = STATUS_CONFIG[story.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;

  const formattedDate = new Date(story.updated_at || story.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Determine link based on status
  const storyLink = story.status === "published" 
    ? `/stories/${story.id}` 
    : (story.status === "draft" || story.status === "rejected") 
      ? `/write?id=${story.id}`
      : null;

  const handleDelete = () => {
    if (story.status === "draft") {
      // Direct delete for drafts
      if (!confirm("Delete this draft? This cannot be undone.")) return;
      startTransition(async () => {
        await deleteStoryAction(story.id);
        onRefresh();
      });
    } else {
      // Show dialog for non-drafts
      setShowDeleteDialog(true);
    }
  };

  const handleRequestDeletion = () => {
    startTransition(async () => {
      await requestDeletionAction(story.id, deleteReason || undefined);
      setShowDeleteDialog(false);
      setDeleteReason("");
      onRefresh();
    });
  };

  const handleCancelDeletion = () => {
    startTransition(async () => {
      await cancelDeletionRequestAction(story.id);
      onRefresh();
    });
  };

  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (storyLink) {
      return (
        <Link href={storyLink} className="block">
          {children}
        </Link>
      );
    }
    return <>{children}</>;
  };

  return (
    <>
      <CardWrapper>
        <Card className={`border-chalk-white-dark transition-colors hover:border-atlantic-blue/20 hover:shadow-md cursor-pointer ${story.deletion_requested ? "border-red-200 bg-red-50/30" : ""}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge className={statusConfig.color}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {statusConfig.label}
                  </Badge>
                  {story.anonymous && (
                    <Badge variant="outline" className="text-xs">
                      Anonymous
                    </Badge>
                  )}
                  {story.deletion_requested && (
                    <Badge className="bg-red-100 text-red-700">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Deletion Pending
                    </Badge>
                  )}
                </div>

                <h3 className="mb-2 font-serif text-xl font-semibold">
                  {story.title || "Untitled Story"}
                </h3>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Updated {formattedDate}
                  </span>
                  {story.location_name && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {story.location_name}
                    </span>
                  )}
                  {story.timeline_year && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {story.timeline_year}
                    </span>
                  )}
                </div>

                {story.status === "rejected" && story.rejection_reason && (
                  <div className="mt-3 rounded-md bg-copper-clay/10 p-3">
                    <p className="text-sm font-medium text-copper-clay">Feedback:</p>
                    <p className="text-sm text-copper-clay-dark">{story.rejection_reason}</p>
                  </div>
                )}

                {story.deletion_requested && story.deletion_reason && (
                  <div className="mt-3 rounded-md bg-red-100 p-3">
                    <p className="text-sm font-medium text-red-700">Your deletion reason:</p>
                    <p className="text-sm text-red-600">{story.deletion_reason}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                {(story.status === "draft" || story.status === "rejected") && (
                  <Link href={`/write?id=${story.id}`}>
                    <Button variant="outline" size="sm" className="w-full gap-1">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                )}
                {story.status === "published" && (
                  <Link href={`/stories/${story.id}`}>
                    <Button variant="outline" size="sm" className="w-full gap-1">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </Link>
                )}
                
                {/* Delete/Cancel buttons */}
                {story.deletion_requested ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelDeletion}
                    disabled={isPending}
                    className="gap-1 border-moss-green text-moss-green hover:bg-moss-green/10"
                  >
                    <Undo2 className="h-4 w-4" />
                    Cancel
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </CardWrapper>

      {/* Deletion Request Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Story Deletion</DialogTitle>
            <DialogDescription>
              Since this story is not a draft, an admin will review your deletion request.
              Please provide a reason (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Why do you want to delete this story? (optional)"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestDeletion}
              disabled={isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isPending ? "Submitting..." : "Request Deletion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

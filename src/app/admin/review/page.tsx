"use client";

import { useEffect, useState, useTransition } from "react";
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
  ArrowLeft,
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  Calendar,
  User,
  Clock,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/supabase";

type Story = Tables<"stories"> & {
  users?: { display_name: string | null; email: string } | null;
};

export default function ReviewQueuePage() {
  const router = useRouter();
  const { user, isAdmin, isLoading, profileChecked } = useUser();
  const [stories, setStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isLoading && profileChecked && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [isLoading, profileChecked, user, isAdmin, router]);

  const fetchStories = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("stories")
      .select(`
        *,
        users:author_id (display_name, email)
      `)
      .eq("status", "review")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching stories:", error);
    } else {
      setStories(data || []);
    }
    setLoadingStories(false);
  };

  useEffect(() => {
    if (!user || !isAdmin) return;
    fetchStories();
  }, [user, isAdmin]);

  const handleApprove = (story: Story) => {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("stories")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
        })
        .eq("id", story.id);

      if (error) {
        console.error("Error approving story:", error);
      } else {
        setStories((prev) => prev.filter((s) => s.id !== story.id));
      }
    });
  };

  const handleReject = () => {
    if (!selectedStory) return;

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("stories")
        .update({
          status: "rejected",
          rejection_reason: rejectReason,
        })
        .eq("id", selectedStory.id);

      if (error) {
        console.error("Error rejecting story:", error);
      } else {
        setStories((prev) => prev.filter((s) => s.id !== selectedStory.id));
        setRejectDialogOpen(false);
        setRejectReason("");
        setSelectedStory(null);
      }
    });
  };

  const openRejectDialog = (story: Story) => {
    setSelectedStory(story);
    setRejectDialogOpen(true);
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

          <div className="mb-8">
            <h1 className="mb-2 font-serif text-3xl font-semibold">Review Queue</h1>
            <p className="text-muted-foreground">
              Stories waiting for your review. Approve to publish or reject with feedback.
            </p>
          </div>

          {loadingStories ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-atlantic-blue border-t-transparent" />
            </div>
          ) : stories.length === 0 ? (
            <Card className="border-chalk-white-dark">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="mb-4 h-12 w-12 text-moss-green" />
                <h3 className="mb-2 text-lg font-medium">All caught up!</h3>
                <p className="text-sm text-muted-foreground">
                  No stories waiting for review.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {stories.map((story) => (
                <Card key={story.id} className="border-chalk-white-dark">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="font-serif text-xl">
                          {story.title || "Untitled Story"}
                        </CardTitle>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {story.anonymous
                              ? "Anonymous"
                              : story.users?.display_name || story.users?.email || "Unknown"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Submitted{" "}
                            {new Date(story.created_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                          {story.location_name && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {story.location_name}
                            </span>
                          )}
                          {story.timeline_year && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {story.timeline_year}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-atlantic-blue/10 text-atlantic-blue">
                        In Review
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Story Preview */}
                    <div
                      className="prose prose-sm mb-6 max-h-48 overflow-hidden text-slate-grey"
                      dangerouslySetInnerHTML={{
                        __html: story.body?.slice(0, 500) + "..." || "",
                      }}
                    />

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => handleApprove(story)}
                        disabled={isPending}
                        className="gap-2 bg-moss-green text-chalk-white hover:bg-moss-green/90"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve & Publish
                      </Button>
                      <Button
                        onClick={() => openRejectDialog(story)}
                        disabled={isPending}
                        variant="outline"
                        className="gap-2 border-copper-clay text-copper-clay hover:bg-copper-clay/10"
                      >
                        <XCircle className="h-4 w-4" />
                        Request Changes
                      </Button>
                      <Link href={`/stories/${story.id}?preview=true`} target="_blank">
                        <Button variant="ghost" className="gap-2">
                          <Eye className="h-4 w-4" />
                          View Full
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Provide feedback to help the author improve their story. Be kind and constructive.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="What changes would improve this story?"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isPending || !rejectReason.trim()}
              className="bg-copper-clay text-chalk-white hover:bg-copper-clay-light"
            >
              Send Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

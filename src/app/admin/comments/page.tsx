"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Eye, EyeOff, Trash2, ExternalLink } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";

interface Comment {
  id: string;
  body: string;
  status: string;
  created_at: string;
  story_id: string;
  story: { title: string } | null;
  author: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const STATUS_COLORS: Record<string, string> = {
  visible: "bg-green-100 text-green-700",
  hidden: "bg-slate-100 text-slate-700",
  flagged: "bg-amber-100 text-amber-700",
};

export default function AdminCommentsPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading, profileChecked } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isLoading && profileChecked && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [isLoading, profileChecked, user, isAdmin, router]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    fetchComments();
  }, [user, isAdmin, statusFilter]);

  const fetchComments = async () => {
    const supabase = createClient();
    let query = (supabase
      .from("comments") as any)
      .select(`
        id, body, status, created_at, story_id,
        story:stories(title),
        author:users(display_name, avatar_url)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setComments((data as Comment[]) || []);
    setLoadingComments(false);
  };

  const updateStatus = (commentId: string, newStatus: string) => {
    startTransition(async () => {
      const supabase = createClient();
      await (supabase.from("comments") as any).update({ status: newStatus }).eq("id", commentId);
      fetchComments();
    });
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment permanently?")) return;

    const supabase = createClient();
    await (supabase.from("comments") as any).delete().eq("id", commentId);
    fetchComments();
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

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="mb-2 font-serif text-3xl font-semibold">Comments</h1>
              <p className="text-muted-foreground">
                Moderate community comments.
              </p>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All comments</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>

          {/* Comments List */}
          {loadingComments ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-atlantic-blue border-t-transparent" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id} className="border-chalk-white-dark">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage
                          src={comment.author?.avatar_url || undefined}
                          alt={comment.author?.display_name || "User"}
                        />
                        <AvatarFallback className="bg-sea-foam text-slate-grey">
                          {comment.author?.display_name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {comment.author?.display_name || "Anonymous"}
                          </span>
                          <Badge className={STATUS_COLORS[comment.status] || ""}>
                            {comment.status}
                          </Badge>
                        </div>

                        <p className="text-sm mb-2">{comment.body}</p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            {new Date(comment.created_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {comment.story && (
                            <Link
                              href={`/stories/${comment.story_id}`}
                              className="flex items-center gap-1 text-atlantic-blue hover:underline"
                            >
                              on "{comment.story.title}"
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {comment.status === "visible" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatus(comment.id, "hidden")}
                            disabled={isPending}
                            title="Hide comment"
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatus(comment.id, "visible")}
                            disabled={isPending}
                            title="Show comment"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteComment(comment.id)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          title="Delete comment"
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
            <Card className="border-dashed border-chalk-white-dark">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No comments found.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

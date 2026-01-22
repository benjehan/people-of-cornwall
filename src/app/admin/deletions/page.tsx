"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Trash2, XCircle, AlertTriangle } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { approveDeletionAction, rejectDeletionAction } from "@/app/actions/stories";

interface DeletionRequest {
  id: string;
  title: string;
  status: string;
  deletion_reason: string | null;
  deletion_requested_at: string;
  author_display_name: string | null;
  author: { display_name: string | null; email: string } | null;
}

export default function AdminDeletionsPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading, profileChecked } = useUser();
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isLoading && profileChecked && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [isLoading, profileChecked, user, isAdmin, router]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    fetchRequests();
  }, [user, isAdmin]);

  const fetchRequests = async () => {
    const supabase = createClient();
    const { data, error } = await (supabase
      .from("stories") as any)
      .select(`
        id, title, status, deletion_reason, deletion_requested_at, author_display_name,
        author:users(display_name, email)
      `)
      .eq("deletion_requested", true)
      .eq("soft_deleted", false)
      .order("deletion_requested_at", { ascending: false });

    if (error) {
      console.error("Error fetching deletion requests:", error);
    } else {
      setRequests((data as DeletionRequest[]) || []);
    }
    setLoadingRequests(false);
  };

  const handleApprove = (storyId: string) => {
    if (!confirm("Delete this story permanently? This cannot be undone.")) return;
    
    startTransition(async () => {
      await approveDeletionAction(storyId);
      fetchRequests();
    });
  };

  const handleReject = (storyId: string) => {
    startTransition(async () => {
      await rejectDeletionAction(storyId);
      fetchRequests();
    });
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

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h1 className="font-serif text-3xl font-bold tracking-tight text-granite">Deletion Requests</h1>
            </div>
            <p className="text-stone">
              Review and approve story deletion requests from authors.
            </p>
          </div>

          {/* Requests List */}
          {loadingRequests ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-granite border-t-transparent" />
            </div>
          ) : requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id} className="border-red-200 bg-red-50/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge className="bg-red-100 text-red-700">
                            Deletion Requested
                          </Badge>
                          <Badge variant="outline" className="border-stone text-stone">
                            {request.status}
                          </Badge>
                        </div>

                        <h3 className="mb-2 font-serif text-xl font-bold text-granite">
                          {request.title || "Untitled"}
                        </h3>

                        <p className="mb-2 text-sm text-stone">
                          by {request.author_display_name || request.author?.display_name || "Anonymous"} 
                          {request.author?.email && ` (${request.author.email})`}
                        </p>

                        <p className="text-xs text-silver">
                          Requested {new Date(request.deletion_requested_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>

                        {request.deletion_reason && (
                          <div className="mt-3 rounded-md bg-white/70 p-3 border border-red-100">
                            <p className="text-sm font-medium text-granite">Author's reason:</p>
                            <p className="text-sm text-stone">{request.deletion_reason}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link href={`/stories/${request.id}`}>
                          <Button variant="outline" size="sm" className="w-full gap-1 border-granite text-granite hover:bg-granite hover:text-parchment">
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          disabled={isPending}
                          className="gap-1 bg-red-600 text-white hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(request.id)}
                          disabled={isPending}
                          className="gap-1 border-stone text-stone hover:bg-cream"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
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
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-stone/50" />
                <p className="text-stone">No deletion requests pending.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

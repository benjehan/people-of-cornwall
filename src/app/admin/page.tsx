"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  CheckCircle,
  Users,
  MessageSquare,
  Folder,
  Trash2,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  totalStories: number;
  pendingReview: number;
  publishedStories: number;
  totalUsers: number;
  totalComments: number;
  pendingDeletions: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAdmin, isLoading, profileChecked } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    // Wait for both auth loading AND profile check before redirecting
    if (!isLoading && profileChecked && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [isLoading, profileChecked, user, isAdmin, router]);

  useEffect(() => {
    if (!user || !isAdmin) return;

    const fetchStats = async () => {
      const supabase = createClient();

      // Fetch counts
      const [storiesRes, reviewRes, publishedRes, usersRes, commentsRes, deletionsRes] = await Promise.all([
        supabase.from("stories").select("id", { count: "exact", head: true }),
        supabase.from("stories").select("id", { count: "exact", head: true }).eq("status", "review"),
        supabase.from("stories").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("comments").select("id", { count: "exact", head: true }),
        supabase.from("stories").select("id", { count: "exact", head: true }).eq("deletion_requested", true).eq("soft_deleted", false),
      ]);

      setStats({
        totalStories: storiesRes.count || 0,
        pendingReview: reviewRes.count || 0,
        publishedStories: publishedRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalComments: commentsRes.count || 0,
        pendingDeletions: deletionsRes.count || 0,
      });
      setLoadingStats(false);
    };

    fetchStats();
  }, [user, isAdmin]);

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
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8">
            <h1 className="mb-2 font-serif text-3xl font-semibold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage stories, users, and community content.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-chalk-white-dark">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-atlantic-blue/10 p-3">
                    <FileText className="h-6 w-6 text-atlantic-blue" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {loadingStats ? "..." : stats?.totalStories}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Stories</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Link href="/admin/review">
              <Card className="border-chalk-white-dark transition-colors hover:border-copper-clay/50 hover:bg-copper-clay/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-copper-clay/10 p-3">
                      <Clock className="h-6 w-6 text-copper-clay" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">
                        {loadingStats ? "..." : stats?.pendingReview}
                      </p>
                      <p className="text-sm text-muted-foreground">Pending Review</p>
                    </div>
                  </div>
                  {stats && stats.pendingReview > 0 && (
                    <Badge className="mt-3 bg-copper-clay text-chalk-white">
                      Action needed
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>

            <Card className="border-chalk-white-dark">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-moss-green/10 p-3">
                    <CheckCircle className="h-6 w-6 text-moss-green" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {loadingStats ? "..." : stats?.publishedStories}
                    </p>
                    <p className="text-sm text-muted-foreground">Published</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-chalk-white-dark">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-sea-foam/30 p-3">
                    <Users className="h-6 w-6 text-atlantic-blue" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {loadingStats ? "..." : stats?.totalUsers}
                    </p>
                    <p className="text-sm text-muted-foreground">Contributors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin/review">
              <Card className="h-full border-chalk-white-dark transition-colors hover:border-atlantic-blue/30 hover:bg-chalk-white-dark/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-atlantic-blue" />
                    Review Queue
                  </CardTitle>
                  <CardDescription>
                    Review and moderate submitted stories.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/stories">
              <Card className="h-full border-chalk-white-dark transition-colors hover:border-atlantic-blue/30 hover:bg-chalk-white-dark/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-atlantic-blue" />
                    All Stories
                  </CardTitle>
                  <CardDescription>
                    Browse and manage all stories.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/comments">
              <Card className="h-full border-chalk-white-dark transition-colors hover:border-atlantic-blue/30 hover:bg-chalk-white-dark/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5 text-atlantic-blue" />
                    Comments
                  </CardTitle>
                  <CardDescription>
                    Moderate community comments.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/collections">
              <Card className="h-full border-chalk-white-dark transition-colors hover:border-atlantic-blue/30 hover:bg-chalk-white-dark/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Folder className="h-5 w-5 text-atlantic-blue" />
                    Collections
                  </CardTitle>
                  <CardDescription>
                    Manage themed story collections.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/deletions">
              <Card className="h-full border-chalk-white-dark transition-colors hover:border-red-200 hover:bg-red-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Trash2 className="h-5 w-5 text-red-500" />
                    Deletion Requests
                    {stats && stats.pendingDeletions > 0 && (
                      <Badge className="ml-auto bg-red-100 text-red-700">
                        {stats.pendingDeletions}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Review story deletion requests.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

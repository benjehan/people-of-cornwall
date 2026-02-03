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
  Sparkles,
  Vote,
  Megaphone,
  Calendar,
  HelpCircle,
  Camera,
  GraduationCap,
  Trophy,
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
  activePrompts: number;
  pendingEvents: number;
  pendingNominations: number;
  pendingWhereIsThis: number;
  pendingLostCornwall: number;
  pendingSchoolPhotos: number;
  pendingSportClubs: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAdmin, isModerator, isLoading } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || !isModerator)) {
      router.push("/");
    }
  }, [isLoading, user, isModerator, router]);

  useEffect(() => {
    if (!user || !isModerator) return;

    const fetchStats = async () => {
      const supabase = createClient();

      // Fetch counts (excluding soft-deleted stories)
      const [storiesRes, reviewRes, publishedRes, usersRes, commentsRes, deletionsRes, promptsRes, eventsRes, nominationsRes, whereIsThisRes, lostCornwallRes, schoolPhotosRes, sportClubsRes] = await Promise.all([
        (supabase.from("stories") as any).select("id", { count: "exact", head: true }).eq("soft_deleted", false),
        (supabase.from("stories") as any).select("id", { count: "exact", head: true }).eq("status", "review").eq("soft_deleted", false),
        (supabase.from("stories") as any).select("id", { count: "exact", head: true }).eq("status", "published").eq("soft_deleted", false),
        (supabase.from("users") as any).select("id", { count: "exact", head: true }),
        (supabase.from("comments") as any).select("id", { count: "exact", head: true }),
        (supabase.from("stories") as any).select("id", { count: "exact", head: true }).eq("deletion_requested", true).eq("soft_deleted", false),
        (supabase.from("prompts") as any).select("id", { count: "exact", head: true }).eq("active", true),
        (supabase.from("events") as any).select("id", { count: "exact", head: true }).eq("is_approved", false),
        (supabase.from("poll_nominations") as any).select("id", { count: "exact", head: true }).eq("is_approved", false),
        (supabase.from("where_is_this") as any).select("id", { count: "exact", head: true }).eq("is_pending", true),
        (supabase.from("lost_cornwall") as any).select("id", { count: "exact", head: true }).eq("is_pending", true),
        (supabase.from("school_photos") as any).select("id", { count: "exact", head: true }).eq("is_published", false),
        (supabase.from("sport_clubs") as any).select("id", { count: "exact", head: true }).eq("is_published", false),
      ]);

      setStats({
        totalStories: storiesRes.count || 0,
        pendingReview: reviewRes.count || 0,
        publishedStories: publishedRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalComments: commentsRes.count || 0,
        pendingDeletions: deletionsRes.count || 0,
        activePrompts: promptsRes.count || 0,
        pendingEvents: eventsRes.count || 0,
        pendingNominations: nominationsRes.count || 0,
        pendingWhereIsThis: whereIsThisRes.count || 0,
        pendingLostCornwall: lostCornwallRes.count || 0,
        pendingSchoolPhotos: schoolPhotosRes.count || 0,
        pendingSportClubs: sportClubsRes.count || 0,
      });
      setLoadingStats(false);
    };

    fetchStats();
  }, [user, isModerator]);

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
          <div className="mb-8">
            <h1 className="mb-2 font-serif text-3xl font-bold tracking-tight text-granite">
              {isAdmin ? "Admin Dashboard" : "Moderator Dashboard"}
            </h1>
            <p className="text-stone">
              {isAdmin
                ? "Manage stories, users, and community content."
                : "Help moderate community content and approve submissions."}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-bone bg-cream">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-granite/10 p-3">
                    <FileText className="h-6 w-6 text-granite" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-granite">
                      {loadingStats ? "..." : stats?.totalStories}
                    </p>
                    <p className="text-sm text-stone">Total Stories</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Link href="/admin/review">
              <Card className="border-bone bg-cream transition-all hover:border-slate/50 hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-copper/10 p-3">
                      <Clock className="h-6 w-6 text-copper" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-granite">
                        {loadingStats ? "..." : stats?.pendingReview}
                      </p>
                      <p className="text-sm text-stone">Pending Review</p>
                    </div>
                  </div>
                  {stats && stats.pendingReview > 0 && (
                    <Badge className="mt-3 bg-copper text-parchment border-0">
                      Action needed
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>

            <Card className="border-bone bg-cream">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-granite">
                      {loadingStats ? "..." : stats?.publishedStories}
                    </p>
                    <p className="text-sm text-stone">Published</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-bone bg-cream">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-stone/10 p-3">
                    <Users className="h-6 w-6 text-granite" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-granite">
                      {loadingStats ? "..." : stats?.totalUsers}
                    </p>
                    <p className="text-sm text-stone">Contributors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <h2 className="mb-4 font-serif text-xl font-bold text-granite">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin/review">
              <Card className="h-full border-bone bg-cream transition-all hover:border-granite/30 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-serif text-granite">
                    <Clock className="h-5 w-5 text-copper" />
                    Review Queue
                  </CardTitle>
                  <CardDescription className="text-stone">
                    Review and moderate submitted stories.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/stories">
              <Card className="h-full border-bone bg-cream transition-all hover:border-granite/30 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-serif text-granite">
                    <FileText className="h-5 w-5 text-granite" />
                    All Stories
                  </CardTitle>
                  <CardDescription className="text-stone">
                    Browse and manage all stories.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {isAdmin && (
              <Link href="/admin/prompts">
                <Card className="h-full border-bone bg-cream transition-all hover:border-granite/30 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-serif text-granite">
                      <Sparkles className="h-5 w-5 text-copper" />
                      Prompts
                      {stats && stats.activePrompts > 0 && (
                        <Badge className="ml-auto bg-copper/10 text-copper border-0 text-xs">
                          {stats.activePrompts} active
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-stone">
                      Manage community writing prompts.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}

            <Link href="/admin/comments">
              <Card className="h-full border-bone bg-cream transition-all hover:border-granite/30 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-serif text-granite">
                    <MessageSquare className="h-5 w-5 text-granite" />
                    Comments
                  </CardTitle>
                  <CardDescription className="text-stone">
                    Moderate community comments.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {isAdmin && (
              <Link href="/admin/collections">
                <Card className="h-full border-bone bg-cream transition-all hover:border-granite/30 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-serif text-granite">
                      <Folder className="h-5 w-5 text-granite" />
                      Collections
                    </CardTitle>
                    <CardDescription className="text-stone">
                      Manage themed story collections.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}

            {isAdmin && (
              <Link href="/admin/deletions">
                <Card className="h-full border-bone bg-cream transition-all hover:border-red-200 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-serif text-granite">
                      <Trash2 className="h-5 w-5 text-red-500" />
                      Deletion Requests
                      {stats && stats.pendingDeletions > 0 && (
                        <Badge className="ml-auto bg-red-100 text-red-700 border-0">
                          {stats.pendingDeletions}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-stone">
                      Review story deletion requests.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}

            <Link href="/admin/polls">
              <Card className="h-full border-bone bg-cream transition-all hover:border-granite/30 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-serif text-granite">
                    <Vote className="h-5 w-5 text-copper" />
                    Community Polls
                    {stats && stats.pendingNominations > 0 && (
                      <Badge className="ml-auto bg-yellow-500 text-white border-0">
                        {stats.pendingNominations} pending
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-stone">
                    Create and manage "Best of Cornwall" voting polls.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/events">
              <Card className="h-full border-bone bg-cream transition-all hover:border-granite/30 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-serif text-granite">
                    <Calendar className="h-5 w-5 text-copper" />
                    Local Events
                    {stats && stats.pendingEvents > 0 && (
                      <Badge className="ml-auto bg-yellow-500 text-white border-0">
                        {stats.pendingEvents} pending
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-stone">
                    Review and approve community-submitted events.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/where-is-this">
              <Card className="h-full border-bone bg-cream transition-all hover:border-granite/30 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-serif text-granite">
                    <HelpCircle className="h-5 w-5 text-atlantic" />
                    Where Is This?
                    {stats && stats.pendingWhereIsThis > 0 && (
                      <Badge className="ml-auto bg-yellow-500 text-white border-0">
                        {stats.pendingWhereIsThis} pending
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-stone">
                    Review challenge submissions and manage active challenges.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/lost-cornwall">
              <Card className="h-full border-bone bg-cream transition-all hover:border-granite/30 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-serif text-granite">
                    <Camera className="h-5 w-5 text-sepia" />
                    Lost Cornwall
                    {stats && stats.pendingLostCornwall > 0 && (
                      <Badge className="ml-auto bg-yellow-500 text-white border-0">
                        {stats.pendingLostCornwall} pending
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-stone">
                    Review historic photo submissions and manage the gallery.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/school-photos">
              <Card className="h-full border-bone bg-cream transition-all hover:border-granite/30 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-serif text-granite">
                    <GraduationCap className="h-5 w-5 text-atlantic" />
                    School Photos
                    {stats && stats.pendingSchoolPhotos > 0 && (
                      <Badge className="ml-auto bg-yellow-500 text-white border-0">
                        {stats.pendingSchoolPhotos} pending
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-stone">
                    Review school photo submissions and manage the gallery.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/sport-clubs">
              <Card className="h-full border-bone bg-cream transition-all hover:border-granite/30 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-serif text-granite">
                    <Trophy className="h-5 w-5 text-copper" />
                    Sport & Clubs
                    {stats && stats.pendingSportClubs > 0 && (
                      <Badge className="ml-auto bg-yellow-500 text-white border-0">
                        {stats.pendingSportClubs} pending
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-stone">
                    Review sport & clubs photo submissions and manage the gallery.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>

          {/* Admin Tools */}
          {isAdmin && (
            <>
              <h2 className="mb-4 mt-10 font-serif text-xl font-bold text-granite">Admin Tools</h2>
              <div className="grid gap-4 sm:grid-cols-2 mb-10">
                <Link href="/admin/users">
                  <Card className="h-full border-bone bg-cream transition-all hover:border-granite/30 hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg font-serif text-granite">
                        <Users className="h-5 w-5 text-granite" />
                        User Management
                      </CardTitle>
                      <CardDescription className="text-stone">
                        Manage user roles and promote moderators.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </div>
            </>
          )}

          {/* Community Promotion */}
          <h2 className="mb-4 mt-10 font-serif text-xl font-bold text-granite">Community</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/community" target="_blank">
              <Card className="h-full border-copper bg-gradient-to-r from-copper/10 to-atlantic/10 transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-serif text-granite">
                    <Megaphone className="h-5 w-5 text-copper" />
                    View Community Page
                  </CardTitle>
                  <CardDescription className="text-stone">
                    See the public community page with polls and badges. Share this link to promote voting!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <code className="text-xs text-atlantic bg-parchment px-2 py-1 rounded">
                    peopleofcornwall.com/community
                  </code>
                </CardContent>
              </Card>
            </Link>

            <Card className="h-full border-bone bg-cream">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-serif text-granite">
                  📬 Weekly Digest
                </CardTitle>
                <CardDescription className="text-stone">
                  Automatic emails go out every Sunday at 10am with top stories.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-stone">
                  Managed via Vercel Cron. Users can subscribe on the community page or in their profile settings.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

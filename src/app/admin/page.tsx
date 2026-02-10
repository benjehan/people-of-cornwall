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
  AlertCircle,
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

  // Build attention items from stats
  const attentionItems = stats
    ? [
        { label: "stories to review", count: stats.pendingReview, href: "/admin/review", icon: Clock, color: "bg-copper text-parchment" },
        { label: "pending events", count: stats.pendingEvents, href: "/admin/events", icon: Calendar, color: "bg-yellow-500 text-white" },
        { label: "poll nominations", count: stats.pendingNominations, href: "/admin/polls", icon: Vote, color: "bg-yellow-500 text-white" },
        { label: "Where Is This?", count: stats.pendingWhereIsThis, href: "/admin/where-is-this", icon: HelpCircle, color: "bg-yellow-500 text-white" },
        { label: "Lost Cornwall", count: stats.pendingLostCornwall, href: "/admin/lost-cornwall", icon: Camera, color: "bg-yellow-500 text-white" },
        { label: "school photos", count: stats.pendingSchoolPhotos, href: "/admin/school-photos", icon: GraduationCap, color: "bg-yellow-500 text-white" },
        { label: "sport & clubs", count: stats.pendingSportClubs, href: "/admin/sport-clubs", icon: Trophy, color: "bg-yellow-500 text-white" },
        ...(isAdmin
          ? [{ label: "deletion requests", count: stats.pendingDeletions, href: "/admin/deletions", icon: Trash2, color: "bg-red-100 text-red-700" }]
          : []),
      ].filter((item) => item.count > 0)
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Title & Overview Stats */}
          <div className="mb-8">
            <h1 className="mb-2 font-serif text-3xl font-bold tracking-tight text-granite">
              {isAdmin ? "Admin Dashboard" : "Moderator Dashboard"}
            </h1>
            {loadingStats ? (
              <p className="text-sm text-stone">Loading overview...</p>
            ) : stats ? (
              <p className="text-sm text-stone">
                {stats.totalStories} stories &middot; {stats.publishedStories} published &middot; {stats.totalUsers} contributors &middot; {stats.totalComments} comments
              </p>
            ) : null}
          </div>

          {/* Needs Attention */}
          {!loadingStats && (
            <div className="mb-10">
              {attentionItems.length > 0 ? (
                <Card className="border-copper/30 bg-copper/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-serif text-granite">
                      <AlertCircle className="h-5 w-5 text-copper" />
                      Needs Attention
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {attentionItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                          <Badge className={`${item.color} border-0 px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80`}>
                            {item.count} {item.label}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="font-medium text-green-800">All clear — nothing needs attention right now.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Stories & Writing */}
          <section className="mb-10">
            <h2 className="mb-1 font-serif text-xl font-bold text-granite">Stories & Writing</h2>
            <p className="mb-4 text-sm text-stone">Review submissions, manage published stories, and curate collections.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/admin/review">
                <Card className="h-full border-bone bg-cream transition-all hover:border-granite/30 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-serif text-granite">
                      <Clock className="h-5 w-5 text-copper" />
                      Review Queue
                      {stats && stats.pendingReview > 0 && (
                        <Badge className="ml-auto bg-copper text-parchment border-0">
                          {stats.pendingReview}
                        </Badge>
                      )}
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
                <Link href="/admin/prompts">
                  <Card className="h-full border-bone bg-cream transition-all hover:border-granite/30 hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg font-serif text-granite">
                        <Sparkles className="h-5 w-5 text-copper" />
                        Writing Prompts
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
            </div>
          </section>

          {/* Photo Archives */}
          <section className="mb-10">
            <h2 className="mb-1 font-serif text-xl font-bold text-granite">Photo Archives</h2>
            <p className="mb-4 text-sm text-stone">Historic photos, school memories, and sport & club galleries.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          </section>

          {/* Community */}
          <section className="mb-10">
            <h2 className="mb-1 font-serif text-xl font-bold text-granite">Community</h2>
            <p className="mb-4 text-sm text-stone">Polls, events, and interactive challenges.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                      Create and manage &ldquo;Best of Cornwall&rdquo; voting polls.
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
            </div>
          </section>

          {/* Admin Tools */}
          {isAdmin && (
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-xl font-bold text-granite">Admin Tools</h2>
              <div className="grid gap-4 sm:grid-cols-2">
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
            </section>
          )}

          {/* Public Links */}
          <section>
            <h2 className="mb-4 font-serif text-xl font-bold text-granite">Public Links</h2>
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
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

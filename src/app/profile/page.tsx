"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { FileText, Settings, PenLine, Calendar, Mail } from "lucide-react";
import { useUser, getDisplayName, getAvatarUrl } from "@/hooks/use-user";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/profile");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-atlantic-blue border-t-transparent" />
        </main>
      </div>
    );
  }

  if (!user) return null;

  const displayName = getDisplayName(user, profile);
  const avatarUrl = getAvatarUrl(user, profile);
  const joinedDate = new Date(user.created_at || Date.now()).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen flex-col bg-chalk-white">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-4xl px-4">
          {/* Profile Header */}
          <Card className="mb-8 border-chalk-white-dark">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <Avatar className="h-24 w-24 ring-4 ring-atlantic-blue/10">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback className="bg-atlantic-blue text-2xl text-chalk-white">
                    {displayName[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center sm:text-left">
                  <h1 className="mb-1 font-serif text-3xl font-semibold">
                    {displayName}
                  </h1>
                  <div className="mb-4 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-4">
                    <span className="flex items-center justify-center gap-1 sm:justify-start">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </span>
                    <span className="flex items-center justify-center gap-1 sm:justify-start">
                      <Calendar className="h-4 w-4" />
                      Joined {joinedDate}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                    <Link href="/write">
                      <Button className="gap-2 bg-granite text-parchment hover:bg-slate">
                        <PenLine className="h-4 w-4" />
                        Share a story
                      </Button>
                    </Link>
                    <Link href="/profile/settings">
                      <Button variant="outline" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/profile/stories">
              <Card className="h-full border-chalk-white-dark transition-colors hover:border-atlantic-blue/30 hover:bg-chalk-white-dark/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-atlantic-blue" />
                    My Stories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View and manage your drafts, submitted, and published stories.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/profile/settings">
              <Card className="h-full border-chalk-white-dark transition-colors hover:border-atlantic-blue/30 hover:bg-chalk-white-dark/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5 text-atlantic-blue" />
                    Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Update your profile information and preferences.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

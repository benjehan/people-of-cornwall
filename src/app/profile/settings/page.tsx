"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, CheckCircle } from "lucide-react";
import { useUser, getDisplayName, getAvatarUrl } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useUser();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/profile/settings");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(getDisplayName(user, profile));
      setAvatarUrl(getAvatarUrl(user, profile) || "");
    }
  }, [user, profile]);

  const handleSave = () => {
    if (!user) return;

    startTransition(async () => {
      const supabase = createClient();

      // Check if profile exists
      const { data: existingProfile } = await (supabase
        .from("users") as any)
        .select("id")
        .eq("id", user.id)
        .single();

      if (existingProfile) {
        // Update existing profile
        await (supabase
          .from("users") as any)
          .update({
            display_name: displayName,
            avatar_url: avatarUrl || null,
          })
          .eq("id", user.id);
      } else {
        // Create new profile
        await (supabase.from("users") as any).insert({
          id: user.id,
          email: user.email || "",
          display_name: displayName,
          avatar_url: avatarUrl || null,
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
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

  const currentAvatarUrl = getAvatarUrl(user, profile);

  return (
    <div className="flex min-h-screen flex-col bg-chalk-white">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-2xl px-4">
          {/* Back link */}
          <Link
            href="/profile"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to profile
          </Link>

          <h1 className="mb-8 font-serif text-3xl font-semibold">Settings</h1>

          {/* Profile Settings */}
          <Card className="mb-6 border-chalk-white-dark">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update how your name appears on your stories.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Preview */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={avatarUrl || currentAvatarUrl || undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="bg-atlantic-blue text-xl text-chalk-white">
                    {displayName[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm text-muted-foreground">
                  <p>Your profile picture comes from your login provider (Google).</p>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should we call you?"
                />
                <p className="text-xs text-muted-foreground">
                  This name will appear on your stories (unless you choose to post anonymously).
                </p>
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user.email || ""}
                  disabled
                  className="bg-chalk-white-dark"
                />
                <p className="text-xs text-muted-foreground">
                  Your email address cannot be changed here.
                </p>
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSave}
                  disabled={isPending}
                  className="gap-2 bg-atlantic-blue text-chalk-white hover:bg-atlantic-blue-light"
                >
                  <Save className="h-4 w-4" />
                  {isPending ? "Saving..." : "Save changes"}
                </Button>
                {saved && (
                  <span className="flex items-center gap-1 text-sm text-moss-green">
                    <CheckCircle className="h-4 w-4" />
                    Saved
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="border-chalk-white-dark">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Information about your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account ID</span>
                  <span className="font-mono text-xs">{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Login Provider</span>
                  <span className="capitalize">
                    {user.app_metadata?.provider || "Email"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span>
                    {new Date(user.created_at || Date.now()).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

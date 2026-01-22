"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, CheckCircle, AlertCircle } from "lucide-react";
import { useUser, getDisplayName, getAvatarUrl } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useUser();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/profile/settings");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(getDisplayName(user, profile));
      setBio((profile as any)?.bio || "");
    }
  }, [user, profile]);

  const handleSave = () => {
    if (!user) return;
    setError(null);

    startTransition(async () => {
      try {
        console.log('[SETTINGS] Saving profile for user:', user.id);
        const supabase = createClient();

        // Check if profile exists
        const { data: existingProfile, error: fetchError } = await (supabase
          .from("users") as any)
          .select("id")
          .eq("id", user.id)
          .single();

        console.log('[SETTINGS] Existing profile:', existingProfile, 'Error:', fetchError);

        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await (supabase
            .from("users") as any)
            .update({
              display_name: displayName,
              bio: bio || null,
            })
            .eq("id", user.id);

          if (updateError) {
            console.error('[SETTINGS] Update error:', updateError);
            setError(updateError.message);
            return;
          }
          console.log('[SETTINGS] Profile updated successfully');
        } else {
          // Create new profile
          const { error: insertError } = await (supabase.from("users") as any).insert({
            id: user.id,
            email: user.email || "",
            display_name: displayName,
            bio: bio || null,
          });

          if (insertError) {
            console.error('[SETTINGS] Insert error:', insertError);
            setError(insertError.message);
            return;
          }
          console.log('[SETTINGS] Profile created successfully');
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err: any) {
        console.error('[SETTINGS] Catch error:', err);
        setError(err?.message || "Failed to save");
      }
    });
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col bg-parchment">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-granite border-t-transparent" />
        </main>
      </div>
    );
  }

  const currentAvatarUrl = getAvatarUrl(user, profile);

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-2xl px-4">
          {/* Back link */}
          <Link
            href="/profile"
            className="mb-6 inline-flex items-center gap-1 text-sm text-stone hover:text-granite"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to profile
          </Link>

          <h1 className="mb-8 font-serif text-3xl font-bold text-granite">Settings</h1>

          {/* Profile Settings */}
          <Card className="mb-6 border-bone bg-cream">
            <CardHeader>
              <CardTitle className="text-granite">Profile Information</CardTitle>
              <CardDescription>
                Update how your name appears on your stories.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Preview */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-bone">
                  <AvatarImage
                    src={currentAvatarUrl || undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="bg-granite text-xl text-parchment">
                    {displayName[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm text-stone">
                  <p>Your profile picture comes from your login provider (Google).</p>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-granite">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should we call you?"
                  className="border-bone bg-parchment"
                />
                <p className="text-xs text-stone">
                  This name will appear on your stories (unless you choose to post anonymously).
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-granite">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a bit about yourself..."
                  className="border-bone bg-parchment min-h-[100px]"
                />
                <p className="text-xs text-stone">
                  This will appear on your public author profile.
                </p>
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-granite">Email</Label>
                <Input
                  id="email"
                  value={user.email || ""}
                  disabled
                  className="bg-bone text-stone"
                />
                <p className="text-xs text-stone">
                  Your email address cannot be changed here.
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* Save Button */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSave}
                  disabled={isPending}
                  className="gap-2 bg-granite text-parchment hover:bg-slate"
                >
                  <Save className="h-4 w-4" />
                  {isPending ? "Saving..." : "Save changes"}
                </Button>
                {saved && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Saved!
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="border-bone bg-cream">
            <CardHeader>
              <CardTitle className="text-granite">Account</CardTitle>
              <CardDescription>
                Information about your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone">Account ID</span>
                  <span className="font-mono text-xs text-granite">{user.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone">Login Provider</span>
                  <span className="capitalize text-granite">
                    {user.app_metadata?.provider || "Email"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone">Joined</span>
                  <span className="text-granite">
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

"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoryEditor } from "@/components/story/story-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Eye,
  EyeOff,
  Save,
  Send,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { saveStoryAction, submitStoryAction } from "@/app/actions/stories";
import { createClient } from "@/lib/supabase/client";

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useUser();
  const [isPending, startTransition] = useTransition();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoadingStory, setIsLoadingStory] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [timelineYear, setTimelineYear] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [storyId, setStoryId] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/write");
    }
  }, [authLoading, user, router]);

  // Load existing story if ID provided
  useEffect(() => {
    const id = searchParams.get("id");
    if (!id || !user) return;

    const loadStory = async () => {
      setIsLoadingStory(true);
      const supabase = createClient();
      
      const { data: story, error } = await supabase
        .from("stories")
        .select("*")
        .eq("id", id)
        .eq("author_id", user.id)
        .single();

      if (error) {
        console.error("Error loading story:", error);
        setIsLoadingStory(false);
        return;
      }

      if (story) {
        setStoryId(story.id);
        setTitle(story.title || "");
        setBody(story.body || "");
        setLocationName(story.location_name || "");
        setLocationLat(story.location_lat || null);
        setLocationLng(story.location_lng || null);
        setTimelineYear(story.timeline_year?.toString() || "");
        setAnonymous(story.anonymous || false);
      }
      setIsLoadingStory(false);
    };

    loadStory();
  }, [searchParams, user]);

  // Autosave every 30 seconds
  useEffect(() => {
    if (!user || !title.trim()) return;

    const timer = setInterval(() => {
      handleSave();
    }, 30000);

    return () => clearInterval(timer);
  }, [user, title, body, locationName, timelineYear, anonymous]);

  const handleSave = () => {
    if (!user || !title.trim()) return;

    startTransition(async () => {
      const result = await saveStoryAction({
        id: storyId || undefined,
        title: title.trim(),
        body,
        location_name: locationName || null,
        location_lat: locationLat,
        location_lng: locationLng,
        timeline_year: timelineYear ? parseInt(timelineYear) : null,
        anonymous,
      });

      if (result.data) {
        setStoryId(result.data.id);
        setLastSaved(new Date());
      }
    });
  };

  const handleSubmit = () => {
    if (!user || !title.trim() || !body.trim()) return;

    startTransition(async () => {
      // First save
      const saveResult = await saveStoryAction({
        id: storyId || undefined,
        title: title.trim(),
        body,
        location_name: locationName || null,
        location_lat: locationLat,
        location_lng: locationLng,
        timeline_year: timelineYear ? parseInt(timelineYear) : null,
        anonymous,
      });

      if (saveResult.data) {
        // Then submit for review
        const submitResult = await submitStoryAction(saveResult.data.id);
        
        if (!submitResult.error) {
          router.push("/profile/stories?submitted=true");
        }
      }
    });
  };

  if (authLoading || isLoadingStory) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-atlantic-blue border-t-transparent" />
            {isLoadingStory && <p className="mt-4 text-muted-foreground">Loading your story...</p>}
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-chalk-white">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-4xl px-4">
          {/* Back link */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Editor */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h1 className="mb-2 font-serif text-3xl font-semibold">
                  Share a Story
                </h1>
                <p className="text-muted-foreground">
                  Every story matters. Share your memories, experiences, and
                  moments from Cornwall.
                </p>
              </div>

              {/* Title */}
              <div className="mb-6">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your story a title..."
                  className="border-0 bg-transparent text-3xl font-serif font-semibold placeholder:text-muted-foreground/50 focus-visible:ring-0"
                />
              </div>

              {/* Editor */}
              <StoryEditor
                content={body}
                onChange={setBody}
                placeholder="Start writing your story... What happened? Where were you? What do you remember?"
                storyId={storyId || undefined}
              />

              {/* Save Status */}
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  {lastSaved && (
                    <>
                      <CheckCircle className="h-4 w-4 text-moss-green" />
                      <span>
                        Saved {lastSaved.toLocaleTimeString()}
                      </span>
                    </>
                  )}
                </div>
                <span>
                  {body.replace(/<[^>]*>/g, "").length} characters
                </span>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Metadata */}
              <Card className="border-chalk-white-dark bg-chalk-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Story Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Location */}
                  <div>
                    <label className="mb-1.5 text-sm font-medium">
                      Location in Cornwall
                    </label>
                    <LocationAutocomplete
                      value={locationName}
                      onChange={({ name, lat, lng }) => {
                        setLocationName(name);
                        setLocationLat(lat);
                        setLocationLng(lng);
                      }}
                      placeholder="Search for a place..."
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Start typing to search villages, towns, beaches, landmarks...
                    </p>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                      <Calendar className="h-4 w-4 text-atlantic-blue" />
                      Year (approximate)
                    </label>
                    <Input
                      type="number"
                      value={timelineYear}
                      onChange={(e) => setTimelineYear(e.target.value)}
                      placeholder="e.g. 1985"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <Separator />

                  {/* Anonymous */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium">
                        {anonymous ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-atlantic-blue" />
                        )}
                        {anonymous ? "Anonymous" : "Show my name"}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {anonymous
                          ? "Your name won't be shown"
                          : "Your name will appear on the story"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAnonymous(!anonymous)}
                    >
                      {anonymous ? "Show name" : "Go anonymous"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="border-chalk-white-dark bg-chalk-white">
                <CardContent className="space-y-3 pt-6">
                  <Button
                    onClick={handleSubmit}
                    disabled={isPending || !title.trim() || !body.trim()}
                    className="w-full gap-2 bg-copper-clay text-chalk-white hover:bg-copper-clay-light"
                  >
                    <Send className="h-4 w-4" />
                    Send for review
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isPending || !title.trim()}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save as draft
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Stories are reviewed before publishing to maintain quality.
                  </p>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="border-sea-foam/30 bg-sea-foam/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Writing Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li>• Be specific about places and times</li>
                    <li>• Include sensory details — sights, sounds, smells</li>
                    <li>• Focus on a single moment or memory</li>
                    <li>• Your perspective is what makes it unique</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

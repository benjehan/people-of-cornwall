"use client";

import { Suspense, useState, useEffect, useTransition } from "react";
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
  AlertCircle,
  RefreshCw,
  Sparkles,
  Headphones,
  User,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { saveStoryAction, submitStoryAction } from "@/app/actions/stories";
import { createClient } from "@/lib/supabase/client";
import { AmbientSoundSelector } from "@/components/story/ambient-sound-selector";

type StoryStatus = "draft" | "review" | "published" | "rejected" | "unpublished";

function WritePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useUser();
  const [isPending, startTransition] = useTransition();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [timelineYear, setTimelineYear] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [originalStatus, setOriginalStatus] = useState<StoryStatus | null>(null);
  const [promptId, setPromptId] = useState<string | null>(null);
  const [promptTitle, setPromptTitle] = useState<string | null>(null);
  const [ambientSound, setAmbientSound] = useState<string | null>(null);
  const [voicePreference, setVoicePreference] = useState<"male" | "female">("male");

  // Redirect logic - only redirect if auth is done loading AND no user
  useEffect(() => {
    if (user) {
      setShouldRedirect(false);
      return;
    }
    
    if (!authLoading && !user) {
      setShouldRedirect(true);
      router.push("/login?redirect=/write");
    }
  }, [authLoading, user, router]);

  // Load existing story if ID provided, or prompt if prompt ID provided
  useEffect(() => {
    const id = searchParams.get("id");
    const prompt = searchParams.get("prompt");
    
    if (!user) return;

    const loadData = async () => {
      setIsLoadingStory(true);
      const supabase = createClient();
      
      // Load existing story
      if (id) {
        const { data: story, error } = await (supabase
          .from("stories") as any)
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
          setOriginalStatus(story.status as StoryStatus);
          setTitle(story.title || "");
          setBody(story.body || "");
          setLocationName(story.location_name || "");
          setLocationLat(story.location_lat || null);
          setLocationLng(story.location_lng || null);
          setTimelineYear(story.timeline_year?.toString() || "");
          setAnonymous(story.anonymous || false);
          setPromptId(story.prompt_id || null);
          setAmbientSound(story.ambient_sound || null);
          setVoicePreference(story.voice_preference || "male");
        }
      }
      
      // Load prompt if provided
      if (prompt && !id) {
        const { data: promptData } = await (supabase
          .from("prompts") as any)
          .select("id, title")
          .eq("id", prompt)
          .single();
          
        if (promptData) {
          setPromptId(promptData.id);
          setPromptTitle(promptData.title);
        }
      }
      
      setIsLoadingStory(false);
    };

    loadData();
  }, [searchParams, user]);

  // Autosave every 30 seconds (only for drafts)
  useEffect(() => {
    if (!user || !title.trim() || originalStatus === "published") return;

    const timer = setInterval(() => {
      handleSave();
    }, 30000);

    return () => clearInterval(timer);
  }, [user, title, body, locationName, timelineYear, anonymous, originalStatus]);

  const handleSave = () => {
    if (!user || !title.trim()) {
      console.log('[WRITE] Cannot save - no user or title');
      return;
    }

    startTransition(async () => {
      console.log('[WRITE] Saving story...');
      const result = await saveStoryAction({
        id: storyId || undefined,
        title: title.trim(),
        body,
        location_name: locationName || null,
        location_lat: locationLat,
        location_lng: locationLng,
        timeline_year: timelineYear ? parseInt(timelineYear) : null,
        anonymous,
        prompt_id: promptId,
        ambient_sound: ambientSound,
        voice_preference: voicePreference,
      });

      console.log('[WRITE] Save result:', result);

      if (result.error) {
        console.error('[WRITE] Save error:', result.error);
        alert('Failed to save: ' + result.error);
        return;
      }

      if (result.data) {
        setStoryId(result.data.id);
        setLastSaved(new Date());
        console.log('[WRITE] Saved! Story ID:', result.data.id);
      }
    });
  };

  const handleSubmit = () => {
    if (!user) {
      console.log('[WRITE] Cannot submit - no user');
      alert('Please sign in to submit');
      return;
    }
    if (!title.trim()) {
      alert('Please add a title');
      return;
    }
    if (!body.trim()) {
      alert('Please write some content');
      return;
    }

    startTransition(async () => {
      console.log('[WRITE] Submitting story...');
      
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
        prompt_id: promptId,
        ambient_sound: ambientSound,
        voice_preference: voicePreference,
      });

      console.log('[WRITE] Save result:', saveResult);

      if (saveResult.error) {
        console.error('[WRITE] Save error:', saveResult.error);
        alert('Failed to save: ' + saveResult.error);
        return;
      }

      if (saveResult.data) {
        // Then submit for review
        console.log('[WRITE] Submitting for review, ID:', saveResult.data.id);
        const submitResult = await submitStoryAction(saveResult.data.id);
        
        console.log('[WRITE] Submit result:', submitResult);
        
        if (submitResult.error) {
          console.error('[WRITE] Submit error:', submitResult.error);
          alert('Failed to submit: ' + submitResult.error);
          return;
        }
        
        console.log('[WRITE] Success! Redirecting...');
        router.push("/profile/stories?submitted=true");
      }
    });
  };

  const isEditingPublished = originalStatus === "published";
  const isEditingRejected = originalStatus === "rejected";

  // Show loading while auth is being checked or story is loading
  if ((authLoading && !user) || isLoadingStory) {
    return (
      <div className="flex min-h-screen flex-col bg-parchment">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-granite border-t-transparent" />
            <p className="mt-4 text-stone">
              {isLoadingStory ? "Loading your story..." : "Loading..."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  // No user after auth check - show redirect message
  if (!user && shouldRedirect) {
    return (
      <div className="flex min-h-screen flex-col bg-parchment">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-granite border-t-transparent" />
            <p className="mt-4 text-stone">Redirecting to login...</p>
          </div>
        </main>
      </div>
    );
  }

  // Still checking but no user yet - keep showing loading
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-parchment">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-granite border-t-transparent" />
            <p className="mt-4 text-stone">Checking authentication...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Back link */}
          <Link
            href="/profile/stories"
            className="mb-6 inline-flex items-center gap-1 text-sm text-stone hover:text-granite transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to my stories
          </Link>

          {/* Notice for community prompt */}
          {promptTitle && !storyId && (
            <Card className="mb-6 border-slate/30 bg-slate/5">
              <CardContent className="flex items-start gap-3 py-4">
                <Sparkles className="h-5 w-5 text-slate mt-0.5" />
                <div>
                  <p className="font-medium text-slate">Community Prompt</p>
                  <p className="text-sm text-stone">
                    You're writing a story for: <strong>"{promptTitle}"</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notice for editing published story */}
          {isEditingPublished && (
            <Card className="mb-6 border-slate/30 bg-slate/5">
              <CardContent className="flex items-start gap-3 py-4">
                <RefreshCw className="h-5 w-5 text-slate mt-0.5" />
                <div>
                  <p className="font-medium text-slate">Editing Published Story</p>
                  <p className="text-sm text-stone">
                    When you submit your changes, the story will be sent for review again.
                    It will remain visible until the updated version is approved.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notice for rejected story */}
          {isEditingRejected && (
            <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
              <CardContent className="flex items-start gap-3 py-4">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-700">Story Needs Changes</p>
                  <p className="text-sm text-amber-600">
                    Please review the feedback and make the necessary changes before resubmitting.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Editor */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h1 className="mb-2 font-serif text-3xl font-bold tracking-tight text-granite">
                  {storyId ? "Edit Story" : "Share a Story"}
                </h1>
                <p className="text-stone">
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
                  className="border-0 bg-transparent text-3xl font-serif font-bold placeholder:text-stone/40 focus-visible:ring-0 px-0"
                />
              </div>

              {/* Editor */}
              <StoryEditor
                content={body}
                onChange={setBody}
                placeholder="Start writing your story... What happened? Where were you? What do you remember?"
                storyId={storyId || undefined}
                title={title}
              />

              {/* Save Status */}
              <div className="mt-4 flex items-center justify-between text-sm text-stone">
                <div className="flex items-center gap-2">
                  {lastSaved && (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
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
              <Card className="border-bone bg-cream">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-serif">Story Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Location */}
                  <div>
                    <label className="mb-1.5 text-sm font-medium text-granite">
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
                    <p className="mt-1 text-xs text-stone">
                      Villages, towns, beaches, landmarks...
                    </p>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-granite">
                      <Calendar className="h-4 w-4 text-slate" />
                      Year (approximate)
                    </label>
                    <Input
                      type="number"
                      value={timelineYear}
                      onChange={(e) => setTimelineYear(e.target.value)}
                      placeholder="e.g. 1985"
                      min="1900"
                      max={new Date().getFullYear()}
                      className="border-bone bg-parchment"
                    />
                  </div>

                  <Separator className="bg-bone" />

                  {/* Anonymous */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-granite">
                        {anonymous ? (
                          <EyeOff className="h-4 w-4 text-stone" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate" />
                        )}
                        {anonymous ? "Anonymous" : "Show my name"}
                      </label>
                      <p className="text-xs text-stone">
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
                      className="border-bone text-granite hover:bg-bone"
                    >
                      {anonymous ? "Show name" : "Go anonymous"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Audio Settings */}
              <Card className="border-bone bg-cream">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-serif flex items-center gap-2">
                    <Headphones className="h-4 w-4 text-slate" />
                    Audio Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Voice Preference for Text-to-Speech */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-granite">
                      <User className="h-4 w-4 text-slate" />
                      Story Reader Voice
                    </label>
                    <p className="text-xs text-stone mb-2">
                      Choose a voice for when readers listen to your story
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={voicePreference === "male" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setVoicePreference("male")}
                        className={voicePreference === "male" 
                          ? "flex-1 bg-granite text-parchment" 
                          : "flex-1 border-bone text-granite hover:bg-bone"}
                      >
                        Male Voice
                      </Button>
                      <Button
                        type="button"
                        variant={voicePreference === "female" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setVoicePreference("female")}
                        className={voicePreference === "female" 
                          ? "flex-1 bg-granite text-parchment" 
                          : "flex-1 border-bone text-granite hover:bg-bone"}
                      >
                        Female Voice
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-bone" />

                  {/* Ambient Sound */}
                  <AmbientSoundSelector
                    value={ambientSound}
                    onChange={setAmbientSound}
                  />
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="border-bone bg-cream">
                <CardContent className="space-y-3 pt-6">
                  <Button
                    onClick={handleSubmit}
                    disabled={isPending || !title.trim() || !body.trim()}
                    className="w-full gap-2 bg-granite text-parchment hover:bg-slate font-medium"
                  >
                    <Send className="h-4 w-4" />
                    {isEditingPublished ? "Submit changes" : "Send for review"}
                  </Button>
                  
                  {!isEditingPublished && (
                    <Button
                      onClick={handleSave}
                      disabled={isPending || !title.trim()}
                      variant="outline"
                      className="w-full gap-2 border-granite text-granite hover:bg-granite hover:text-parchment"
                    >
                      <Save className="h-4 w-4" />
                      Save as draft
                    </Button>
                  )}
                  
                  <p className="text-center text-xs text-stone">
                    {isEditingPublished 
                      ? "Your changes will be reviewed before publishing."
                      : "Stories are reviewed before publishing to maintain quality."}
                  </p>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="border-bone/50 bg-bone/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-granite">
                    Writing Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-xs text-stone">
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

export default function WritePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-parchment">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-granite border-t-transparent" />
        </main>
      </div>
    }>
      <WritePageContent />
    </Suspense>
  );
}

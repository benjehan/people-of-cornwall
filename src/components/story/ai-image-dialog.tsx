"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Wand2, Image as ImageIcon, Download, RefreshCw, Palette, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";

interface AIImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string, attribution?: string) => void;
  storyContent: string;
  storyTitle: string;
  storyId?: string;
}

type ImageStyle = "heritage" | "painting" | "watercolor" | "vintage" | "sketch" | "realistic";

const styleOptions: { value: ImageStyle; label: string; description: string }[] = [
  { value: "heritage", label: "Heritage", description: "Classic travel poster style" },
  { value: "painting", label: "Oil Painting", description: "Brushstrokes, canvas texture" },
  { value: "watercolor", label: "Watercolor", description: "Soft, flowing washes" },
  { value: "vintage", label: "Vintage Photo", description: "1930s-50s photograph" },
  { value: "sketch", label: "Sketch", description: "Pencil or charcoal" },
  { value: "realistic", label: "Realistic", description: "Photorealistic image" },
];

export function AIImageDialog({
  open,
  onOpenChange,
  onInsert,
  storyContent,
  storyTitle,
  storyId,
}: AIImageDialogProps) {
  const { user, isAdmin } = useUser();
  const [mode, setMode] = useState<"suggest" | "custom">("suggest");
  const [customPrompt, setCustomPrompt] = useState("");
  const [suggestedPrompt, setSuggestedPrompt] = useState<string | null>(null);
  const [imageStyle, setImageStyle] = useState<ImageStyle>("heritage");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  // Fetch initial credits when dialog opens
  useEffect(() => {
    if (open && user && !isAdmin) {
      const fetchCredits = async () => {
        const supabase = createClient();
        const { data } = await (supabase
          .from("users") as any)
          .select("ai_image_credits")
          .eq("id", user.id)
          .single();
        
        if (data) {
          setCreditsRemaining(data.ai_image_credits ?? 5);
        }
      };
      fetchCredits();
    }
  }, [open, user, isAdmin]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyContent: storyContent.replace(/<[^>]*>/g, " ").trim(),
          storyTitle,
          customPrompt: mode === "custom" ? customPrompt : null,
          imageStyle,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate image");
      }

      const data = await response.json();
      setGeneratedImage(data.imageUrl);
      setSuggestedPrompt(data.suggestedPrompt);
      
      // Update credits remaining
      if (data.creditsRemaining !== undefined && data.creditsRemaining >= 0) {
        setCreditsRemaining(data.creditsRemaining);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndInsert = () => {
    if (!generatedImage) return;

    // Image is already uploaded to Supabase Storage by the API
    // Just insert it directly into the story
    onInsert(generatedImage, "AI-generated illustration");
    handleClose();
  };

  const handleClose = () => {
    setGeneratedImage(null);
    setSuggestedPrompt(null);
    setCustomPrompt("");
    setError(null);
    onOpenChange(false);
  };

  // Check if story has enough content
  const hasEnoughContent = storyContent.replace(/<[^>]*>/g, "").trim().length > 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-copper" />
            Generate AI Illustration
          </DialogTitle>
          <DialogDescription>
            Create a unique Cornish-style illustration for your story
          </DialogDescription>
        </DialogHeader>

        {/* Credits Display */}
        {!isAdmin && creditsRemaining !== null && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            creditsRemaining === 0 
              ? "bg-red-50 border border-red-200 text-red-700"
              : creditsRemaining <= 2
                ? "bg-amber-50 border border-amber-200 text-amber-700"
                : "bg-green-50 border border-green-200 text-green-700"
          }`}>
            {creditsRemaining === 0 ? (
              <>
                <AlertCircle className="h-4 w-4" />
                <span>No credits remaining — contact us for more!</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>
                  <strong>{creditsRemaining}</strong> free {creditsRemaining === 1 ? "image" : "images"} remaining
                </span>
              </>
            )}
          </div>
        )}
        {isAdmin && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-purple-50 border border-purple-200 text-purple-700">
            <Sparkles className="h-4 w-4" />
            <span>Admin — <strong>unlimited</strong> AI images</span>
          </div>
        )}

        <div className="space-y-4 py-4">
          {!generatedImage ? (
            <>
              {/* Mode Selection */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={mode === "suggest" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("suggest")}
                  className={mode === "suggest" ? "bg-granite text-parchment" : ""}
                >
                  <Wand2 className="h-4 w-4 mr-1" />
                  AI Suggests
                </Button>
                <Button
                  type="button"
                  variant={mode === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("custom")}
                  className={mode === "custom" ? "bg-granite text-parchment" : ""}
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Custom Prompt
                </Button>
              </div>

              {/* AI Suggest Mode */}
              {mode === "suggest" && (
                <div className="rounded-lg bg-cream border border-bone p-4">
                  {hasEnoughContent ? (
                    <>
                      <p className="text-sm text-stone mb-2">
                        AI will read your story and suggest an image that captures its essence.
                      </p>
                      <p className="text-xs text-silver">
                        ✨ Your story has enough content for AI to analyze
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-amber-700">
                      ⚠️ Please write more of your story first (at least a few paragraphs) 
                      so AI can understand what image would suit it best.
                    </p>
                  )}
                </div>
              )}

              {/* Custom Prompt Mode */}
              {mode === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="custom-prompt">Describe the image you want</Label>
                  <Textarea
                    id="custom-prompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., A fishing boat returning to Mousehole harbour at sunset, with seagulls overhead and the village in the background..."
                    className="min-h-[100px] border-bone"
                  />
                  <p className="text-xs text-silver">
                    Describe the scene, objects, or moment. The Cornish heritage style will be applied automatically.
                  </p>
                </div>
              )}

              {/* Style Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Palette className="h-4 w-4" />
                  Art Style
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {styleOptions.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setImageStyle(style.value)}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        imageStyle === style.value
                          ? "border-copper bg-copper/10"
                          : "border-bone hover:border-granite"
                      }`}
                    >
                      <span className="block text-sm font-medium text-granite">{style.label}</span>
                      <span className="block text-xs text-stone">{style.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Info about styles */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
                <strong>Tip:</strong> Each style produces very different results. Try "Vintage Photo" for old-timey feel, 
                "Oil Painting" for artistic flair, or "Realistic" for photo-like images.
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={
                  isGenerating || 
                  (mode === "suggest" && !hasEnoughContent) || 
                  (mode === "custom" && !customPrompt.trim()) ||
                  (!isAdmin && creditsRemaining !== null && creditsRemaining <= 0)
                }
                className="w-full bg-granite text-parchment hover:bg-slate gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating... (may take 15-30 seconds)
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Illustration
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-silver">
                {isAdmin 
                  ? "As admin, you have unlimited AI image generations."
                  : creditsRemaining !== null && creditsRemaining > 0
                    ? `This will use 1 of your ${creditsRemaining} remaining credits.`
                    : "You've used all your free credits."}
              </p>
            </>
          ) : (
            <>
              {/* Generated Image Preview */}
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden border border-bone">
                  <img 
                    src={generatedImage} 
                    alt="AI Generated Illustration"
                    className="w-full h-auto"
                  />
                </div>

                {suggestedPrompt && (
                  <div className="rounded-lg bg-cream border border-bone p-3">
                    <p className="text-xs text-stone mb-1">AI interpreted your story as:</p>
                    <p className="text-sm text-granite italic">"{suggestedPrompt}"</p>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGeneratedImage(null);
                      setSuggestedPrompt(null);
                    }}
                    className="flex-1 gap-1"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Generate Another
                  </Button>
                  <Button
                    onClick={handleSaveAndInsert}
                    className="flex-1 bg-granite text-parchment hover:bg-slate gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Use This Image
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {!generatedImage && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

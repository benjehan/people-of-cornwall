"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2, Sparkles, Tag, ImagePlus, Image as ImageIcon, Wand2, Palette, ChevronDown, ChevronUp } from "lucide-react";

type ImageStyle = "heritage" | "painting" | "watercolor" | "vintage" | "sketch";

const styleOptions: { value: ImageStyle; label: string; description: string }[] = [
  { value: "heritage", label: "Heritage", description: "Classic museum archive style" },
  { value: "painting", label: "Oil Painting", description: "Rich, textured brushstrokes" },
  { value: "watercolor", label: "Watercolor", description: "Soft, flowing colors" },
  { value: "vintage", label: "Vintage Photo", description: "Sepia tones, aged look" },
  { value: "sketch", label: "Sketch", description: "Pencil or charcoal drawing" },
];

interface ReviewPanelProps {
  storyId: string;
  storyStatus: string;
  storyTitle: string;
  storyBody: string;
  currentSummary?: string | null;
  currentTags?: string[] | null;
  hasImage?: boolean;
}

export function AdminReviewPanel({ 
  storyId, 
  storyStatus,
  storyTitle,
  storyBody,
  currentSummary,
  currentTags,
  hasImage = false,
}: ReviewPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // AI Summary state
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState(currentSummary || "");
  const [aiTags, setAiTags] = useState<string[]>(currentTags || []);
  
  // AI Image generation state
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [imageMode, setImageMode] = useState<"suggest" | "custom">("suggest");
  const [imageStyle, setImageStyle] = useState<ImageStyle>("heritage");
  const [customImagePrompt, setCustomImagePrompt] = useState("");

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setActionResult(null);

    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          storyId, 
          title: storyTitle, 
          body: storyBody 
        }),
      });

      const data = await response.json();

      if (data.error) {
        setActionResult({ success: false, message: `AI Error: ${data.error}` });
      } else {
        setAiSummary(data.summary);
        setAiTags(data.tags || []);
        setActionResult({ success: true, message: "AI summary generated and saved!" });
      }
    } catch (error) {
      setActionResult({ success: false, message: "Failed to generate summary" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    setActionResult(null);

    try {
      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          storyContent: storyBody.replace(/<[^>]*>/g, " ").trim(),
          storyTitle,
          customPrompt: imageMode === "custom" ? customImagePrompt : null,
          imageStyle,
          storyId,
          insertIntoStory: true, // Tell API to insert into story body
        }),
      });

      const data = await response.json();

      if (data.error) {
        setActionResult({ success: false, message: `AI Image Error: ${data.error}` });
      } else {
        setGeneratedImageUrl(data.imageUrl);
        setActionResult({ success: true, message: "AI image generated and added to story!" });
        setShowImageOptions(false);
        // Refresh to show the new image
        router.refresh();
      }
    } catch (error) {
      setActionResult({ success: false, message: "Failed to generate image" });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleApprove = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/stories/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storyId }),
        });

        const data = await response.json();

        if (data.error) {
          setActionResult({ success: false, message: data.error });
        } else {
          setActionResult({ success: true, message: "Story published successfully!" });
          setTimeout(() => {
            router.push("/admin/review");
            router.refresh();
          }, 1500);
        }
      } catch (error) {
        setActionResult({ success: false, message: "Failed to approve story" });
      }
    });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setActionResult({ success: false, message: "Please provide feedback for the author" });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/stories/reject", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storyId, reason: rejectionReason }),
        });

        const data = await response.json();

        if (data.error) {
          setActionResult({ success: false, message: data.error });
        } else {
          setActionResult({ success: true, message: "Story returned to author with feedback" });
          setTimeout(() => {
            router.push("/admin/review");
            router.refresh();
          }, 1500);
        }
      } catch (error) {
        setActionResult({ success: false, message: "Failed to reject story" });
      }
    });
  };

  // Only show for stories in review
  if (storyStatus !== "review") {
    return null;
  }

  return (
    <Card className="border-copper/30 bg-copper/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-granite">
          <Sparkles className="h-5 w-5 text-copper" />
          Admin Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actionResult && (
          <div
            className={`rounded-md p-3 text-sm ${
              actionResult.success
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {actionResult.message}
          </div>
        )}

        {/* AI Summary Section */}
        <div className="border-b border-bone pb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-granite">AI Summary & Tags</label>
            <Button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              variant="outline"
              size="sm"
              className="gap-1.5 border-granite text-granite hover:bg-granite hover:text-parchment"
            >
              {isGenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {aiSummary ? "Regenerate" : "Generate"}
            </Button>
          </div>
          
          {aiSummary ? (
            <div className="space-y-2">
              <p className="text-sm text-stone italic">"{aiSummary}"</p>
              {aiTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-silver" />
                  {aiTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs border-bone">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-stone">
              Click "Generate" to create an AI summary and tags for this story.
            </p>
          )}
        </div>

        {/* AI Image Generation Section */}
        <div className="border-b border-bone pb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-granite">Story Image</label>
            {!hasImage && !generatedImageUrl && (
              <Button
                onClick={() => setShowImageOptions(!showImageOptions)}
                variant="outline"
                size="sm"
                className="gap-1.5 border-granite text-granite hover:bg-granite hover:text-parchment"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Generate AI Image
                {showImageOptions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
          
          {hasImage || generatedImageUrl ? (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <ImageIcon className="h-4 w-4" />
              <span>Story has an image</span>
              {generatedImageUrl && (
                <span className="text-xs text-stone">(AI generated)</span>
              )}
            </div>
          ) : showImageOptions ? (
            <div className="mt-3 space-y-4 rounded-lg bg-parchment border border-bone p-4">
              {/* Mode Selection */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={imageMode === "suggest" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setImageMode("suggest")}
                  className={imageMode === "suggest" ? "bg-granite text-parchment" : ""}
                >
                  <Wand2 className="h-4 w-4 mr-1" />
                  AI Suggests
                </Button>
                <Button
                  type="button"
                  variant={imageMode === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setImageMode("custom")}
                  className={imageMode === "custom" ? "bg-granite text-parchment" : ""}
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Custom Prompt
                </Button>
              </div>

              {/* AI Suggest Mode Info */}
              {imageMode === "suggest" && (
                <p className="text-xs text-stone">
                  AI will analyze the story and create an appropriate illustration automatically.
                </p>
              )}

              {/* Custom Prompt */}
              {imageMode === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="admin-custom-prompt" className="text-xs">Describe the image</Label>
                  <Textarea
                    id="admin-custom-prompt"
                    value={customImagePrompt}
                    onChange={(e) => setCustomImagePrompt(e.target.value)}
                    placeholder="e.g., A fishing boat returning to Mousehole harbour at sunset..."
                    className="min-h-[80px] border-bone text-sm"
                  />
                </div>
              )}

              {/* Style Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-xs">
                  <Palette className="h-3.5 w-3.5" />
                  Art Style
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {styleOptions.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setImageStyle(style.value)}
                      className={`text-left p-2 rounded border transition-all ${
                        imageStyle === style.value
                          ? "border-copper bg-copper/10"
                          : "border-bone hover:border-granite"
                      }`}
                    >
                      <span className="block text-xs font-medium text-granite">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || (imageMode === "custom" && !customImagePrompt.trim())}
                className="w-full bg-granite text-parchment hover:bg-slate gap-2"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating... (15-30s)
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Illustration
                  </>
                )}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-stone">
              This story has no image. Generate an AI illustration to make it more engaging.
            </p>
          )}
        </div>

        {!showRejectForm ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleApprove}
              disabled={isPending}
              className="flex-1 gap-2 bg-green-600 text-white hover:bg-green-700"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Approve & Publish
            </Button>
            <Button
              onClick={() => setShowRejectForm(true)}
              disabled={isPending}
              variant="outline"
              className="flex-1 gap-2 border-stone text-stone hover:bg-stone/10"
            >
              <XCircle className="h-4 w-4" />
              Request Changes
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide feedback to help the author improve their story..."
              rows={4}
              className="resize-none border-bone"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleReject}
                disabled={isPending || !rejectionReason.trim()}
                className="gap-2 bg-slate text-parchment hover:bg-granite"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Send Feedback
              </Button>
              <Button
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionReason("");
                }}
                variant="ghost"
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <p className="text-xs text-stone">
          Approving will publish the story publicly. Requesting changes will return it to the author with your feedback.
        </p>
      </CardContent>
    </Card>
  );
}

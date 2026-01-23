"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Wand2, FileText, Minimize2, Loader2, Check, X, Edit3, Image, Video, AlertCircle } from "lucide-react";

interface AIEnhanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalContent: string;
  title: string;
  onAccept: (content: string) => void;
}

type EnhanceMode = "polish" | "expand" | "simplify";

interface ExtractedMedia {
  type: "image" | "video";
  html: string;
  position: number; // paragraph index where it appeared
}

// Extract media elements from HTML and return clean text + media info
function extractMediaFromHtml(html: string): { textOnly: string; media: ExtractedMedia[] } {
  const media: ExtractedMedia[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  let paragraphIndex = 0;
  const textParts: string[] = [];
  
  // Walk through all nodes
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let currentParagraphText = "";
  
  doc.body.childNodes.forEach((node, index) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      
      // Check for images
      if (element.tagName === "IMG" || element.querySelector("img")) {
        media.push({
          type: "image",
          html: element.outerHTML,
          position: paragraphIndex,
        });
      }
      // Check for video embeds
      else if (element.classList?.contains("video-embed") || element.querySelector(".video-embed")) {
        media.push({
          type: "video",
          html: element.outerHTML,
          position: paragraphIndex,
        });
      }
      // Check for captions (usually after images)
      else if (element.tagName === "P" && element.querySelector("em")?.textContent?.startsWith("Photo:")) {
        // Skip photo captions - they'll be re-added with images
      }
      // Regular paragraph
      else if (element.tagName === "P" || element.tagName === "H2" || element.tagName === "H3") {
        const text = element.textContent?.trim();
        if (text) {
          textParts.push(text);
          paragraphIndex++;
        }
      }
      // Lists
      else if (element.tagName === "UL" || element.tagName === "OL") {
        const text = element.textContent?.trim();
        if (text) {
          textParts.push(text);
          paragraphIndex++;
        }
      }
    }
  });
  
  return {
    textOnly: textParts.join("\n\n"),
    media,
  };
}

// Re-integrate media into enhanced text
function reintegrateMedia(enhancedText: string, media: ExtractedMedia[]): string {
  if (media.length === 0) {
    // Just wrap in paragraphs
    return enhancedText
      .split("\n\n")
      .filter(p => p.trim())
      .map(p => `<p>${p.trim()}</p>`)
      .join("");
  }
  
  // Split enhanced text into paragraphs
  const paragraphs = enhancedText
    .split("\n\n")
    .filter(p => p.trim())
    .map(p => `<p>${p.trim()}</p>`);
  
  // Group media by position
  const mediaByPosition = new Map<number, ExtractedMedia[]>();
  media.forEach(m => {
    const existing = mediaByPosition.get(m.position) || [];
    existing.push(m);
    mediaByPosition.set(m.position, existing);
  });
  
  // Build final HTML with media inserted at appropriate positions
  const result: string[] = [];
  const totalParagraphs = paragraphs.length;
  
  // Distribute media proportionally if paragraph count changed
  const mediaPositions = Array.from(mediaByPosition.keys()).sort((a, b) => a - b);
  
  paragraphs.forEach((p, index) => {
    result.push(p);
    
    // Check if any media should be inserted after this paragraph
    mediaPositions.forEach(pos => {
      // Calculate proportional position in new text
      const proportionalPos = Math.round((pos / Math.max(1, mediaByPosition.size)) * totalParagraphs);
      if (proportionalPos === index || (index === totalParagraphs - 1 && pos >= index)) {
        const mediaItems = mediaByPosition.get(pos) || [];
        mediaItems.forEach(m => {
          result.push(m.html);
        });
        // Remove from positions so we don't add twice
        mediaByPosition.delete(pos);
      }
    });
  });
  
  // Add any remaining media at the end
  mediaByPosition.forEach(items => {
    items.forEach(m => result.push(m.html));
  });
  
  return result.join("");
}

export function AIEnhanceDialog({
  open,
  onOpenChange,
  originalContent,
  title,
  onAccept,
}: AIEnhanceDialogProps) {
  const [mode, setMode] = useState<EnhanceMode>("polish");
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedText, setEnhancedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");

  // Extract text and media from original content
  const { textOnly, media } = useMemo(() => extractMediaFromHtml(originalContent), [originalContent]);

  const handleEnhance = async () => {
    setIsLoading(true);
    setError(null);
    setEnhancedText(null);

    try {
      const response = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textOnly, // Send only the text, not images/videos
          title,
          mode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to enhance story");
      }

      const data = await response.json();
      setEnhancedText(data.enhanced);
      setEditedText(data.enhanced);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    const textToUse = isEditing ? editedText : enhancedText;
    if (textToUse) {
      // Re-integrate media into the enhanced text
      const finalHtml = reintegrateMedia(textToUse, media);
      onAccept(finalHtml);
      handleClose();
    }
  };

  const handleClose = () => {
    setEnhancedText(null);
    setError(null);
    setIsEditing(false);
    setEditedText("");
    onOpenChange(false);
  };

  const modeInfo: Record<EnhanceMode, { icon: React.ReactNode; title: string; description: string }> = {
    polish: {
      icon: <Sparkles className="h-4 w-4" />,
      title: "Polish",
      description: "Fix grammar, improve flow, keep your voice",
    },
    expand: {
      icon: <FileText className="h-4 w-4" />,
      title: "Expand",
      description: "Add more detail and atmosphere",
    },
    simplify: {
      icon: <Minimize2 className="h-4 w-4" />,
      title: "Simplify",
      description: "Make it shorter and easier to read",
    },
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-copper" />
            AI Writing Assistant
          </DialogTitle>
          <DialogDescription>
            Let AI help polish your story while keeping your authentic voice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mode Selection */}
          {!enhancedText && (
            <>
              <Tabs value={mode} onValueChange={(v) => setMode(v as EnhanceMode)}>
                <TabsList className="grid w-full grid-cols-3">
                  {(Object.keys(modeInfo) as EnhanceMode[]).map((m) => (
                    <TabsTrigger key={m} value={m} className="gap-2">
                      {modeInfo[m].icon}
                      <span className="hidden sm:inline">{modeInfo[m].title}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                {(Object.keys(modeInfo) as EnhanceMode[]).map((m) => (
                  <TabsContent key={m} value={m} className="mt-4">
                    <div className="rounded-lg bg-cream border border-bone p-4">
                      <h4 className="font-medium text-granite flex items-center gap-2">
                        {modeInfo[m].icon}
                        {modeInfo[m].title}
                      </h4>
                      <p className="text-sm text-stone mt-1">{modeInfo[m].description}</p>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              {/* Media Notice */}
              {media.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    {media.some(m => m.type === "image") && <Image className="h-4 w-4" />}
                    {media.some(m => m.type === "video") && <Video className="h-4 w-4" />}
                  </div>
                  <span>
                    Your story contains {media.length} media item{media.length > 1 ? "s" : ""} (
                    {media.filter(m => m.type === "image").length > 0 && `${media.filter(m => m.type === "image").length} image${media.filter(m => m.type === "image").length > 1 ? "s" : ""}`}
                    {media.filter(m => m.type === "image").length > 0 && media.filter(m => m.type === "video").length > 0 && ", "}
                    {media.filter(m => m.type === "video").length > 0 && `${media.filter(m => m.type === "video").length} video${media.filter(m => m.type === "video").length > 1 ? "s" : ""}`}
                    ). These will be <strong>preserved</strong> — only the text will be enhanced.
                  </span>
                </div>
              )}

              {/* Original Preview */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-granite">Your original text:</label>
                <div className="rounded-lg bg-parchment border border-bone p-4 max-h-[200px] overflow-y-auto">
                  <p className="text-sm text-stone whitespace-pre-wrap">{textOnly.slice(0, 500)}{textOnly.length > 500 ? "..." : ""}</p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleEnhance}
                  disabled={isLoading || textOnly.length < 50}
                  className="bg-granite text-parchment hover:bg-slate gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Enhance with AI
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Enhanced Result */}
          {enhancedText && (
            <>
              <div className="space-y-4">
                {/* Media preserved notice */}
                {media.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
                    <Check className="h-4 w-4" />
                    Your {media.length} media item{media.length > 1 ? "s" : ""} will be preserved
                  </div>
                )}

                {/* Toggle edit mode */}
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-granite flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-copper" />
                    AI Enhanced Version
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="gap-1 text-stone"
                  >
                    <Edit3 className="h-3 w-3" />
                    {isEditing ? "Preview" : "Edit"}
                  </Button>
                </div>

                {/* Enhanced content display/edit */}
                {isEditing ? (
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full h-[300px] rounded-lg bg-parchment border border-bone p-4 text-sm text-granite resize-none focus:outline-none focus:ring-2 focus:ring-granite"
                  />
                ) : (
                  <div className="rounded-lg bg-cream border border-copper/30 p-4 max-h-[300px] overflow-y-auto">
                    <p className="text-sm text-granite whitespace-pre-wrap leading-relaxed">
                      {isEditing ? editedText : enhancedText}
                    </p>
                  </div>
                )}

                {/* Info */}
                <p className="text-xs text-silver">
                  💡 You can edit the AI version above before accepting, or reject it to keep your original text.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-between gap-3 pt-2 border-t border-bone">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEnhancedText(null);
                    setIsEditing(false);
                  }}
                  className="text-stone"
                >
                  ← Try Different Mode
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="gap-1 border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                    Keep Original
                  </Button>
                  <Button
                    onClick={handleAccept}
                    className="bg-granite text-parchment hover:bg-slate gap-1"
                  >
                    <Check className="h-4 w-4" />
                    Use This Version
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

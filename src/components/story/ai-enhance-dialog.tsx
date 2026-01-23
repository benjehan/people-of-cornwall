"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Wand2, FileText, Minimize2, Loader2, Check, X, Edit3 } from "lucide-react";

interface AIEnhanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalContent: string;
  title: string;
  onAccept: (content: string) => void;
}

type EnhanceMode = "polish" | "expand" | "simplify";

export function AIEnhanceDialog({
  open,
  onOpenChange,
  originalContent,
  title,
  onAccept,
}: AIEnhanceDialogProps) {
  const [mode, setMode] = useState<EnhanceMode>("polish");
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedContent, setEnhancedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");

  const handleEnhance = async () => {
    setIsLoading(true);
    setError(null);
    setEnhancedContent(null);

    try {
      const response = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: originalContent,
          title,
          mode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to enhance story");
      }

      const data = await response.json();
      setEnhancedContent(data.enhanced);
      setEditedContent(data.enhanced);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    const contentToUse = isEditing ? editedContent : enhancedContent;
    if (contentToUse) {
      onAccept(contentToUse);
      handleClose();
    }
  };

  const handleClose = () => {
    setEnhancedContent(null);
    setError(null);
    setIsEditing(false);
    setEditedContent("");
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

  // Strip HTML for display
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const originalText = stripHtml(originalContent);

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
          {!enhancedContent && (
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

              {/* Original Preview */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-granite">Your original text:</label>
                <div className="rounded-lg bg-parchment border border-bone p-4 max-h-[200px] overflow-y-auto">
                  <p className="text-sm text-stone whitespace-pre-wrap">{originalText.slice(0, 500)}{originalText.length > 500 ? "..." : ""}</p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
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
                  disabled={isLoading || originalText.length < 50}
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
          {enhancedContent && (
            <>
              <div className="space-y-4">
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
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-[300px] rounded-lg bg-parchment border border-bone p-4 text-sm text-granite resize-none focus:outline-none focus:ring-2 focus:ring-granite"
                  />
                ) : (
                  <div className="rounded-lg bg-cream border border-copper/30 p-4 max-h-[300px] overflow-y-auto">
                    <p className="text-sm text-granite whitespace-pre-wrap leading-relaxed">
                      {isEditing ? editedContent : enhancedContent}
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
                    setEnhancedContent(null);
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

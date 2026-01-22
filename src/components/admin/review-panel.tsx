"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Sparkles, Tag } from "lucide-react";

interface ReviewPanelProps {
  storyId: string;
  storyStatus: string;
  storyTitle: string;
  storyBody: string;
  currentSummary?: string | null;
  currentTags?: string[] | null;
}

export function AdminReviewPanel({ 
  storyId, 
  storyStatus,
  storyTitle,
  storyBody,
  currentSummary,
  currentTags,
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

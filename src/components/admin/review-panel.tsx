"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ReviewPanelProps {
  storyId: string;
  storyStatus: string;
}

export function AdminReviewPanel({ storyId, storyStatus }: ReviewPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

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
    <Card className="border-atlantic-blue/30 bg-atlantic-blue/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-atlantic-blue">
          Admin Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actionResult && (
          <div
            className={`rounded-md p-3 text-sm ${
              actionResult.success
                ? "bg-moss-green/10 text-moss-green-dark"
                : "bg-copper-clay/10 text-copper-clay-dark"
            }`}
          >
            {actionResult.message}
          </div>
        )}

        {!showRejectForm ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleApprove}
              disabled={isPending}
              className="flex-1 gap-2 bg-moss-green text-chalk-white hover:bg-moss-green-dark"
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
              className="flex-1 gap-2 border-copper-clay text-copper-clay hover:bg-copper-clay/10"
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
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleReject}
                disabled={isPending || !rejectionReason.trim()}
                className="gap-2 bg-copper-clay text-chalk-white hover:bg-copper-clay-dark"
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

        <p className="text-xs text-muted-foreground">
          Approving will publish the story publicly. Requesting changes will return it to the author with your feedback.
        </p>
      </CardContent>
    </Card>
  );
}

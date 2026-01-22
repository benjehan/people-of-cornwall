import { createClient } from "@/lib/supabase/server";
import { getUserEmail } from "@/lib/supabase/admin";
import { sendStoryRejectedEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { storyId, reason } = await request.json();

    if (!storyId) {
      return NextResponse.json({ error: "Story ID required" }, { status: 400 });
    }

    if (!reason?.trim()) {
      return NextResponse.json({ error: "Rejection reason required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if admin
    const { data: profile } = await (supabase
      .from("users") as any)
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get story details for email
    const { data: story } = await (supabase
      .from("stories") as any)
      .select("id, title, author_id, author_display_name")
      .eq("id", storyId)
      .single();

    // Reject the story
    const { error } = await (supabase
      .from("stories") as any)
      .update({
        status: "rejected",
        rejection_reason: reason.trim(),
      })
      .eq("id", storyId)
      .eq("status", "review");

    if (error) {
      console.error("Error rejecting story:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send email notification to author (non-blocking)
    if (story?.author_id) {
      getUserEmail(story.author_id).then((email) => {
        if (email) {
          sendStoryRejectedEmail({
            to: email,
            authorName: story.author_display_name || "Contributor",
            storyTitle: story.title,
            reason: reason.trim(),
            storyId: story.id,
          }).catch(console.error);
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in reject route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

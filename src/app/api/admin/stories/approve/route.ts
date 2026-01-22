import { createClient } from "@/lib/supabase/server";
import { getUserEmail } from "@/lib/supabase/admin";
import { sendStoryApprovedEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { storyId } = await request.json();

    if (!storyId) {
      return NextResponse.json({ error: "Story ID required" }, { status: 400 });
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

    // Approve the story
    const { error } = await (supabase
      .from("stories") as any)
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq("id", storyId)
      .eq("status", "review");

    if (error) {
      console.error("Error approving story:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send email notification to author (non-blocking)
    if (story?.author_id) {
      getUserEmail(story.author_id).then((email) => {
        if (email) {
          sendStoryApprovedEmail({
            to: email,
            authorName: story.author_display_name || "Contributor",
            storyTitle: story.title,
            storyId: story.id,
          }).catch(console.error);
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in approve route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

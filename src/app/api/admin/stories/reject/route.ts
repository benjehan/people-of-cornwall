import { createClient } from "@/lib/supabase/server";
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
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Reject the story
    const { error } = await supabase
      .from("stories")
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in reject route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

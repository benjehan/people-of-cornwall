import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Track a story view
 * POST /api/stories/[id]/view
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Increment view count using raw SQL for atomicity
    const { error } = await (supabase as any).rpc("increment_story_view", {
      story_id: id,
    });

    if (error) {
      // If the function doesn't exist, fall back to simple increment
      // Note: This is not atomic but works as a fallback
      const { data: story } = await (supabase.from("stories") as any)
        .select("view_count")
        .eq("id", id)
        .single();
      
      await (supabase.from("stories") as any)
        .update({ view_count: (story?.view_count || 0) + 1 })
        .eq("id", id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking view:", error);
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}

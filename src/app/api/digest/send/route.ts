import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://peopleofcornwall.com";

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Add to vercel.json: { "crons": [{ "path": "/api/digest/send", "schedule": "0 10 * * 0" }] }

export async function POST(request: NextRequest) {
  // Verify cron secret or admin token
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not available" }, { status: 500 });
  }

  try {
    // Get the 3 most viewed/liked stories from the past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: topStories, error: storiesError } = await supabase
      .from("stories")
      .select(`
        id,
        title,
        ai_summary,
        author_display_name,
        location_name,
        published_at,
        likes(count)
      `)
      .eq("status", "published")
      .eq("soft_deleted", false)
      .gte("published_at", oneWeekAgo.toISOString())
      .order("published_at", { ascending: false })
      .limit(10);

    if (storiesError) {
      console.error("Error fetching stories:", storiesError);
      return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 });
    }

    // Sort by likes and take top 3
    const sortedStories = (topStories || [])
      .sort((a: any, b: any) => {
        const aLikes = a.likes?.[0]?.count || 0;
        const bLikes = b.likes?.[0]?.count || 0;
        return bLikes - aLikes;
      })
      .slice(0, 3);

    if (sortedStories.length === 0) {
      return NextResponse.json({ message: "No stories to send", sent: 0 });
    }

    // Get active weekly subscribers
    const { data: subscribers, error: subError } = await (supabase
      .from("digest_subscriptions") as any)
      .select("*")
      .eq("is_active", true)
      .eq("frequency", "weekly");

    if (subError) {
      console.error("Error fetching subscribers:", subError);
      return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
    }

    // Build email HTML
    const storiesHtml = sortedStories.map((story: any, index: number) => `
      <div style="margin-bottom: 24px; padding: 20px; background: #F7F6F2; border-radius: 8px;">
        <div style="font-size: 24px; margin-bottom: 8px;">
          ${index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
        </div>
        <h3 style="margin: 0 0 8px; color: #2F2F2F; font-size: 18px;">
          <a href="${SITE_URL}/stories/${story.id}" style="color: #1F4E5F; text-decoration: none;">
            ${story.title}
          </a>
        </h3>
        ${story.ai_summary ? `<p style="margin: 0 0 8px; color: #5A5A5A; font-size: 14px;">${story.ai_summary}</p>` : ""}
        <p style="margin: 0; color: #888; font-size: 12px;">
          By ${story.author_display_name || "Anonymous"}
          ${story.location_name ? ` • 📍 ${story.location_name}` : ""}
        </p>
      </div>
    `).join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Georgia, serif; background: #fff; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="margin: 0 0 8px; color: #2F2F2F; font-size: 24px;">
                📚 People of Cornwall
              </h1>
              <p style="margin: 0; color: #5A5A5A; font-size: 16px;">
                Weekly Story Digest
              </p>
            </div>

            <!-- Intro -->
            <p style="color: #2F2F2F; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Here are the most loved stories from the past week. Each one preserves a piece of Cornwall's living heritage.
            </p>

            <!-- Stories -->
            ${storiesHtml}

            <!-- CTA -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${SITE_URL}/stories" 
                 style="display: inline-block; background: #2F2F2F; color: #F7F6F2; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">
                Explore More Stories
              </a>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #eee; padding-top: 24px; margin-top: 32px; text-align: center;">
              <p style="margin: 0 0 8px; color: #888; font-size: 12px;">
                You're receiving this because you subscribed to our weekly digest.
              </p>
              <p style="margin: 0 0 8px;">
                <a href="${SITE_URL}/profile/settings" 
                   style="color: #1F4E5F; font-size: 12px;">
                  Manage email preferences
                </a>
                <span style="color: #ccc; margin: 0 8px;">|</span>
                <a href="${SITE_URL}/unsubscribe?token={{unsubscribe_token}}" 
                   style="color: #888; font-size: 12px;">
                  Unsubscribe instantly
                </a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send emails to all subscribers
    let sentCount = 0;
    let errorCount = 0;

    for (const subscriber of (subscribers || [])) {
      try {
        const personalizedHtml = emailHtml.replace(
          "{{unsubscribe_token}}", 
          subscriber.unsubscribe_token
        );

        await resend.emails.send({
          from: "People of Cornwall <digest@peopleofcornwall.com>",
          to: subscriber.email,
          subject: `📚 This Week's Top Stories from Cornwall`,
          html: personalizedHtml,
        });

        // Update last_sent_at
        await (supabase
          .from("digest_subscriptions") as any)
          .update({ last_sent_at: new Date().toISOString() })
          .eq("id", subscriber.id);

        sentCount++;
      } catch (err) {
        console.error(`Failed to send to ${subscriber.email}:`, err);
        errorCount++;
      }
    }

    return NextResponse.json({
      message: "Digest sent",
      sent: sentCount,
      errors: errorCount,
      stories: sortedStories.length,
    });

  } catch (error) {
    console.error("Digest error:", error);
    return NextResponse.json({ error: "Failed to send digest" }, { status: 500 });
  }
}

// Allow GET for manual testing (with auth)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Weekly digest endpoint",
    usage: "POST with Bearer token to send digests",
  });
}

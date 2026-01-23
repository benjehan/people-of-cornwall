import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://peopleofcornwall.com";

/**
 * Subscribe to weekly digest
 * POST /api/digest/subscribe
 */
export async function POST(request: NextRequest) {
  try {
    const { email, userId } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if already exists
    const { data: existing } = await (supabase
      .from("digest_subscriptions") as any)
      .select("id, is_active, unsubscribe_token")
      .eq("email", email)
      .single();

    let unsubscribeToken: string;
    let isNewSubscriber = false;

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json({ 
          success: true, 
          message: "Already subscribed",
          alreadySubscribed: true 
        });
      }
      
      // Reactivate
      await (supabase
        .from("digest_subscriptions") as any)
        .update({ is_active: true, frequency: "weekly" })
        .eq("id", existing.id);
      
      unsubscribeToken = existing.unsubscribe_token;
    } else {
      // Create new subscription
      const { data: newSub, error } = await (supabase
        .from("digest_subscriptions") as any)
        .insert({
          email,
          user_id: userId || null,
          frequency: "weekly",
          is_active: true,
        })
        .select("unsubscribe_token")
        .single();

      if (error) {
        console.error("Subscription error:", error);
        return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
      }

      unsubscribeToken = newSub.unsubscribe_token;
      isNewSubscriber = true;
    }

    // Send welcome email for new subscribers
    if (isNewSubscriber && process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: "People of Cornwall <hello@peopleofcornwall.com>",
          to: email,
          subject: "Welcome to the Weekly Digest! 📬",
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; background-color: #F5F2EB; font-family: Georgia, serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F2EB;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 8px;">
          
          <tr>
            <td style="background: linear-gradient(135deg, #3D4F4F 0%, #5A6B6B 100%); padding: 32px 40px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #F5F2EB; font-size: 24px;">📬 Welcome to the Weekly Digest</h1>
              <p style="margin: 8px 0 0; color: #D4C4A8; font-size: 14px;">People of Cornwall</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #3D4F4F; font-size: 16px; line-height: 1.6;">
                You're now subscribed to our <strong>Weekly Story Digest</strong>!
              </p>
              
              <p style="margin: 0 0 20px; color: #5A6B6B; font-size: 16px; line-height: 1.6;">
                Every Sunday, we'll send you the <strong>3 most popular stories</strong> of the week — 
                tales from fishermen, memories of mining days, and the voices that make Cornwall special.
              </p>

              <div style="background-color: #F5F2EB; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; color: #3D4F4F; font-size: 16px;">📖 What to Expect</h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #5A6B6B; font-size: 14px; line-height: 1.8;">
                  <li>3 handpicked stories from our community</li>
                  <li>Quick summaries so you can choose what to read</li>
                  <li>No spam, ever — just Cornish voices</li>
                </ul>
              </div>

              <table cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #3D4F4F; border-radius: 6px;">
                    <a href="${SITE_URL}/stories" style="display: inline-block; padding: 14px 28px; color: #F5F2EB; text-decoration: none; font-size: 14px; font-weight: bold;">
                      Browse Stories
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #8B8B7A; font-size: 14px;">
                Thanks for being part of our community,<br>
                <strong style="color: #3D4F4F;">The People of Cornwall Team</strong>
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="border-top: 1px solid #E5E0D5; padding: 24px 40px; text-align: center;">
              <p style="margin: 0;">
                <a href="${SITE_URL}/profile/settings" style="color: #3D4F4F; font-size: 12px;">Manage preferences</a>
                <span style="color: #ccc; margin: 0 8px;">|</span>
                <a href="${SITE_URL}/unsubscribe?token=${unsubscribeToken}" style="color: #8B8B7A; font-size: 12px;">Unsubscribe</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
          `,
        });
        console.log("Welcome email sent to:", email);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail the subscription if email fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: isNewSubscriber ? "Subscribed! Check your email." : "Welcome back!",
      isNewSubscriber,
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "benjamin.jehan@gmail.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://peopleofcornwall.com";

interface ModerationRequest {
  type: "event" | "poll_nomination" | "where_is_this" | "lost_cornwall" | "comment";
  content: {
    title?: string;
    description?: string;
    text?: string;
    imageUrl?: string;
  };
  submitterId: string;
  submitterEmail?: string;
  itemId?: string;
}

interface ModerationResult {
  isApproved: boolean;
  flags: string[];
  confidence: number;
  reason?: string;
}

// Simple keyword-based moderation (free, no API needed)
// In production, you could integrate with OpenAI Moderation API or similar
function checkContent(content: string): ModerationResult {
  const text = content.toLowerCase();
  const flags: string[] = [];
  
  // Spam patterns
  const spamPatterns = [
    /\b(buy now|click here|free money|act now|limited time)\b/i,
    /\b(cryptocurrency|bitcoin|forex|investment opportunity)\b/i,
    /\b(www\.|http|\.com|\.net|\.org){2,}/i, // Multiple URLs
    /(.)\1{5,}/, // Repeated characters (aaaaaaa)
    /\b(winner|congratulations|you've won|claim your prize)\b/i,
  ];
  
  // Inappropriate content patterns
  const inappropriatePatterns = [
    /\b(f+u+c+k+|s+h+i+t+|a+s+s+h+o+l+e+)\b/i,
    /\b(hate|kill|murder|terrorist)\b/i,
  ];
  
  // Scam patterns
  const scamPatterns = [
    /\b(send money|wire transfer|western union|moneygram)\b/i,
    /\b(nigerian prince|inheritance|lottery winner)\b/i,
    /\b(password|social security|bank account|credit card)\b/i,
  ];
  
  let confidence = 1.0;
  
  for (const pattern of spamPatterns) {
    if (pattern.test(text)) {
      flags.push("spam");
      confidence -= 0.3;
      break;
    }
  }
  
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(text)) {
      flags.push("inappropriate");
      confidence -= 0.4;
      break;
    }
  }
  
  for (const pattern of scamPatterns) {
    if (pattern.test(text)) {
      flags.push("scam");
      confidence -= 0.5;
      break;
    }
  }
  
  // Check for excessive caps (shouting)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5 && text.length > 20) {
    flags.push("excessive_caps");
    confidence -= 0.1;
  }
  
  // Very short suspicious content
  if (text.length < 10 && (text.includes("http") || text.includes("www"))) {
    flags.push("suspicious_link");
    confidence -= 0.3;
  }
  
  return {
    isApproved: flags.length === 0,
    flags,
    confidence: Math.max(0, confidence),
    reason: flags.length > 0 ? `Flagged for: ${flags.join(", ")}` : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ModerationRequest = await request.json();
    
    // Combine all text content
    const allText = [
      body.content.title || "",
      body.content.description || "",
      body.content.text || "",
    ].join(" ").trim();
    
    // Run moderation check
    const result = checkContent(allText);
    
    // Determine notification type
    const typeLabels: Record<string, string> = {
      event: "🗓️ New Event",
      poll_nomination: "🗳️ Poll Nomination",
      where_is_this: "🔍 Where Is This Submission",
      lost_cornwall: "📷 Lost Cornwall Photo",
      comment: "💬 New Comment",
    };
    
    const label = typeLabels[body.type] || "New Submission";
    
    // Send admin notification
    if (process.env.RESEND_API_KEY) {
      const flagWarning = result.flags.length > 0 
        ? `<div style="background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <strong style="color: #DC2626;">⚠️ AI Moderation Flags:</strong>
            <ul style="margin: 8px 0 0 16px; color: #7F1D1D;">
              ${result.flags.map(f => `<li>${f}</li>`).join("")}
            </ul>
            <p style="margin: 8px 0 0; color: #7F1D1D; font-size: 12px;">
              Confidence score: ${Math.round(result.confidence * 100)}%
            </p>
          </div>`
        : "";
      
      const adminLinks: Record<string, string> = {
        event: `${SITE_URL}/admin/events`,
        poll_nomination: `${SITE_URL}/admin/polls`,
        where_is_this: `${SITE_URL}/admin/challenges`,
        lost_cornwall: `${SITE_URL}/admin/lost-cornwall`,
        comment: `${SITE_URL}/admin/comments`,
      };
      
      await resend.emails.send({
        from: "People of Cornwall <notifications@peopleofcornwall.com>",
        to: ADMIN_EMAIL,
        subject: `${result.flags.length > 0 ? "⚠️ FLAGGED: " : ""}${label}: ${body.content.title || "New submission"}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; background-color: #F5F2EB; font-family: Georgia, serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F2EB;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 8px;">
          <tr>
            <td style="background: ${result.flags.length > 0 ? "#DC2626" : "#3D4F4F"}; padding: 24px 40px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 20px;">${label}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              ${flagWarning}
              
              ${body.content.title ? `<h2 style="margin: 0 0 16px; color: #3D4F4F; font-size: 24px;">${body.content.title}</h2>` : ""}
              
              ${body.content.description ? `<p style="color: #5A6B6B; margin-bottom: 16px;">${body.content.description.substring(0, 500)}${body.content.description.length > 500 ? "..." : ""}</p>` : ""}
              
              ${body.content.text ? `<p style="color: #5A6B6B; margin-bottom: 16px;">${body.content.text.substring(0, 500)}${body.content.text.length > 500 ? "..." : ""}</p>` : ""}
              
              ${body.content.imageUrl ? `<img src="${body.content.imageUrl}" style="max-width: 100%; border-radius: 8px; margin-bottom: 16px;" />` : ""}
              
              <table cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                <tr>
                  <td style="padding: 8px 0; color: #5A6B6B;">Submitted by:</td>
                  <td style="padding: 8px 0 8px 16px; color: #3D4F4F;">${body.submitterEmail || "Unknown"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #5A6B6B;">User ID:</td>
                  <td style="padding: 8px 0 8px 16px; color: #3D4F4F; font-family: monospace; font-size: 12px;">${body.submitterId}</td>
                </tr>
              </table>

              <table cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #3D4F4F; border-radius: 6px;">
                    <a href="${adminLinks[body.type] || SITE_URL + "/admin"}" style="display: inline-block; padding: 14px 28px; color: #F5F2EB; text-decoration: none; font-size: 14px; font-weight: bold;">
                      Review in Admin
                    </a>
                  </td>
                </tr>
              </table>
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
    }
    
    return NextResponse.json({
      success: true,
      moderation: result,
    });
  } catch (error) {
    console.error("Moderation check error:", error);
    return NextResponse.json({ error: "Moderation check failed" }, { status: 500 });
  }
}

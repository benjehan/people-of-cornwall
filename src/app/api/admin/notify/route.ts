import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "hello@peopleofcornwall.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://peopleofcornwall.com";

interface NotificationPayload {
  type: "new_event" | "new_story" | "new_nomination" | "new_lost_cornwall";
  eventId?: string;
  eventTitle?: string;
  eventLocation?: string;
  eventDate?: string;
  storyId?: string;
  storyTitle?: string;
  nominationId?: string;
  nominationTitle?: string;
  pollTitle?: string;
  submitterEmail?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: NotificationPayload = await request.json();

    if (!process.env.RESEND_API_KEY) {
      console.log("Admin notification skipped - no RESEND_API_KEY");
      return NextResponse.json({ success: true, message: "Notification skipped - no API key" });
    }

    let subject = "";
    let html = "";

    switch (payload.type) {
      case "new_event":
        subject = `🗓️ New Event Submitted: ${payload.eventTitle}`;
        html = `
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
            <td style="background: linear-gradient(135deg, #B45A3C 0%, #8B4513 100%); padding: 24px 40px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 20px;">🗓️ New Event Submitted</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <h2 style="margin: 0 0 16px; color: #3D4F4F; font-size: 24px;">${payload.eventTitle}</h2>
              
              <table cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; color: #5A6B6B;">📍 Location:</td>
                  <td style="padding: 8px 0 8px 16px; color: #3D4F4F; font-weight: bold;">${payload.eventLocation}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #5A6B6B;">📅 Date:</td>
                  <td style="padding: 8px 0 8px 16px; color: #3D4F4F; font-weight: bold;">${new Date(payload.eventDate || "").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #5A6B6B;">✉️ Submitted by:</td>
                  <td style="padding: 8px 0 8px 16px; color: #3D4F4F;">${payload.submitterEmail}</td>
                </tr>
              </table>

              <table cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #3D4F4F; border-radius: 6px;">
                    <a href="${SITE_URL}/admin/events" style="display: inline-block; padding: 14px 28px; color: #F5F2EB; text-decoration: none; font-size: 14px; font-weight: bold;">
                      Review Event
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid #E5E0D5; padding: 24px 40px; text-align: center;">
              <p style="margin: 0; color: #8B8B7A; font-size: 12px;">
                People of Cornwall Admin Notification
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;
        break;

      case "new_story":
        subject = `📝 New Story Submitted: ${payload.storyTitle}`;
        html = `
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
            <td style="background: linear-gradient(135deg, #3D4F4F 0%, #5A6B6B 100%); padding: 24px 40px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 20px;">📝 New Story Submitted</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <h2 style="margin: 0 0 16px; color: #3D4F4F; font-size: 24px;">${payload.storyTitle}</h2>
              
              <p style="color: #5A6B6B; margin-bottom: 24px;">
                Submitted by: ${payload.submitterEmail}
              </p>

              <table cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #3D4F4F; border-radius: 6px;">
                    <a href="${SITE_URL}/admin/stories/${payload.storyId}" style="display: inline-block; padding: 14px 28px; color: #F5F2EB; text-decoration: none; font-size: 14px; font-weight: bold;">
                      Review Story
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid #E5E0D5; padding: 24px 40px; text-align: center;">
              <p style="margin: 0; color: #8B8B7A; font-size: 12px;">
                People of Cornwall Admin Notification
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;
        break;

      case "new_nomination":
        subject = `🗳️ New Poll Nomination: ${payload.nominationTitle}`;
        html = `
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
            <td style="background: linear-gradient(135deg, #B45A3C 0%, #8B4513 100%); padding: 24px 40px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 20px;">🗳️ New Poll Nomination</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <p style="color: #5A6B6B; margin-bottom: 8px;">Poll: <strong>${payload.pollTitle}</strong></p>
              <h2 style="margin: 0 0 16px; color: #3D4F4F; font-size: 24px;">${payload.nominationTitle}</h2>
              
              <p style="color: #5A6B6B; margin-bottom: 24px;">
                Submitted by: ${payload.submitterEmail}
              </p>

              <table cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #3D4F4F; border-radius: 6px;">
                    <a href="${SITE_URL}/admin/polls" style="display: inline-block; padding: 14px 28px; color: #F5F2EB; text-decoration: none; font-size: 14px; font-weight: bold;">
                      Review Nomination
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid #E5E0D5; padding: 24px 40px; text-align: center;">
              <p style="margin: 0; color: #8B8B7A; font-size: 12px;">
                People of Cornwall Admin Notification
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;
        break;

      default:
        return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
    }

    await resend.emails.send({
      from: "People of Cornwall <notifications@peopleofcornwall.com>",
      to: ADMIN_EMAIL,
      subject,
      html,
    });

    console.log(`Admin notification sent: ${payload.type}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send admin notification:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}

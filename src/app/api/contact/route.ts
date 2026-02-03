import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL || "People of Cornwall <noreply@peopleofcornwall.com>";
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "peopleofcornwall@protonmail.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://peopleofcornwall.com";

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (!resend) {
      console.error("[Contact] Resend not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Send email using Resend
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Form Submission</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f7f4; font-family: Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f7f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #f8f7f4; font-size: 24px; font-weight: normal; letter-spacing: 1px;">
                People of Cornwall
              </h1>
              <p style="margin: 8px 0 0 0; color: #b0b0b0; font-size: 14px;">
                Contact Form Submission
              </p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px 0; color: #1a1a1a; font-size: 24px; font-weight: normal;">
                New Contact Form Message
              </h2>

              <div style="background-color: #f8f7f4; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 16px;">
                  <strong>From:</strong> ${name}
                </p>
                <p style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 16px;">
                  <strong>Email:</strong> <a href="mailto:${email}" style="color: #1F4E5F; text-decoration: none;">${email}</a>
                </p>
                <p style="margin: 0; color: #1a1a1a; font-size: 16px;">
                  <strong>Subject:</strong> ${subject}
                </p>
              </div>

              <div style="background-color: #ffffff; border-left: 3px solid #1F4E5F; padding: 20px; margin: 0 0 24px 0;">
                <h3 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 16px; font-weight: bold;">
                  Message:
                </h3>
                <p style="margin: 0; color: #4a4a4a; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
${message}
                </p>
              </div>

              <div style="text-align: center; padding: 20px 0;">
                <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" style="display: inline-block; background-color: #1a1a1a; color: #f8f7f4; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-size: 15px;">
                  Reply to ${name}
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f0efe9; padding: 24px 40px; text-align: center;">
              <p style="margin: 0; color: #6b6b6b; font-size: 13px; line-height: 1.6;">
                Sent via contact form on<br>
                <a href="${SITE_URL}" style="color: #1a1a1a; text-decoration: none;">peopleofcornwall.com</a>
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

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html,
    });

    if (error) {
      console.error("[Contact] Failed to send email:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    console.log(`[Contact] Message sent from ${name} <${email}>: ${subject}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Contact] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

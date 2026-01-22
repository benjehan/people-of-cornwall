/**
 * Email Service using Resend
 * 
 * Beautiful, simple transactional emails for People of Cornwall
 */

import { Resend } from "resend";

// Initialize Resend (will be undefined if no API key)
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || "People of Cornwall <noreply@peopleofcornwall.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://peopleofcornwall.com";

interface EmailResult {
  success: boolean;
  error?: string;
}

/**
 * Send email - wrapper with error handling
 */
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  if (!resend) {
    console.log("[Email] Resend not configured, skipping email to:", to);
    console.log("[Email] Subject:", subject);
    return { success: true }; // Don't fail if email not configured
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Failed to send:", error);
      return { success: false, error: error.message };
    }

    console.log("[Email] Sent successfully to:", to);
    return { success: true };
  } catch (err) {
    console.error("[Email] Error:", err);
    return { success: false, error: "Failed to send email" };
  }
}

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>People of Cornwall</title>
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
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f0efe9; padding: 24px 40px; text-align: center;">
              <p style="margin: 0; color: #6b6b6b; font-size: 13px; line-height: 1.6;">
                A community archive of Cornish stories and memories<br>
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

// =============================================================================
// EMAIL FUNCTIONS
// =============================================================================

/**
 * Story Approved Email
 */
export async function sendStoryApprovedEmail({
  to,
  authorName,
  storyTitle,
  storyId,
}: {
  to: string;
  authorName: string;
  storyTitle: string;
  storyId: string;
}): Promise<EmailResult> {
  const storyUrl = `${SITE_URL}/stories/${storyId}`;
  
  const html = baseTemplate(`
    <h2 style="margin: 0 0 24px 0; color: #1a1a1a; font-size: 28px; font-weight: normal;">
      Your story is now live! 🎉
    </h2>
    <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.7;">
      Dear ${authorName},
    </p>
    <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.7;">
      Great news! Your story <strong>"${storyTitle}"</strong> has been reviewed and published to the People of Cornwall archive.
    </p>
    <p style="margin: 0 0 32px 0; color: #4a4a4a; font-size: 16px; line-height: 1.7;">
      Thank you for sharing this piece of Cornwall's living history. Your contribution helps preserve our community's memories for generations to come.
    </p>
    <p style="margin: 0 0 32px 0; text-align: center;">
      <a href="${storyUrl}" style="display: inline-block; background-color: #1a1a1a; color: #f8f7f4; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-size: 15px;">
        View Your Story
      </a>
    </p>
    <p style="margin: 0; color: #6b6b6b; font-size: 14px; line-height: 1.6;">
      Feel free to share your story with friends and family.
    </p>
  `);

  return sendEmail({
    to,
    subject: `Your story "${storyTitle}" is now live!`,
    html,
  });
}

/**
 * Story Rejected Email
 */
export async function sendStoryRejectedEmail({
  to,
  authorName,
  storyTitle,
  reason,
  storyId,
}: {
  to: string;
  authorName: string;
  storyTitle: string;
  reason: string;
  storyId: string;
}): Promise<EmailResult> {
  const editUrl = `${SITE_URL}/write?id=${storyId}`;
  
  const html = baseTemplate(`
    <h2 style="margin: 0 0 24px 0; color: #1a1a1a; font-size: 28px; font-weight: normal;">
      Your story needs some changes
    </h2>
    <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.7;">
      Dear ${authorName},
    </p>
    <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.7;">
      Thank you for submitting <strong>"${storyTitle}"</strong> to People of Cornwall. After review, we'd like to suggest some changes before publication.
    </p>
    <div style="background-color: #f8f7f4; border-left: 3px solid #1a1a1a; padding: 16px 20px; margin: 0 0 24px 0;">
      <p style="margin: 0; color: #1a1a1a; font-size: 15px; line-height: 1.6;">
        <strong>Feedback from our team:</strong><br>
        ${reason}
      </p>
    </div>
    <p style="margin: 0 0 32px 0; color: #4a4a4a; font-size: 16px; line-height: 1.7;">
      Don't worry — you can edit your story and resubmit it for review. We're looking forward to publishing it!
    </p>
    <p style="margin: 0 0 32px 0; text-align: center;">
      <a href="${editUrl}" style="display: inline-block; background-color: #1a1a1a; color: #f8f7f4; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-size: 15px;">
        Edit Your Story
      </a>
    </p>
    <p style="margin: 0; color: #6b6b6b; font-size: 14px; line-height: 1.6;">
      If you have questions, feel free to reply to this email.
    </p>
  `);

  return sendEmail({
    to,
    subject: `Your story "${storyTitle}" needs some changes`,
    html,
  });
}

/**
 * New Comment Email
 */
export async function sendNewCommentEmail({
  to,
  authorName,
  storyTitle,
  storyId,
  commenterName,
  commentPreview,
}: {
  to: string;
  authorName: string;
  storyTitle: string;
  storyId: string;
  commenterName: string;
  commentPreview: string;
}): Promise<EmailResult> {
  const storyUrl = `${SITE_URL}/stories/${storyId}`;
  
  const html = baseTemplate(`
    <h2 style="margin: 0 0 24px 0; color: #1a1a1a; font-size: 28px; font-weight: normal;">
      Someone commented on your story
    </h2>
    <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.7;">
      Dear ${authorName},
    </p>
    <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.7;">
      <strong>${commenterName}</strong> left a comment on your story <strong>"${storyTitle}"</strong>:
    </p>
    <div style="background-color: #f8f7f4; border-left: 3px solid #b87333; padding: 16px 20px; margin: 0 0 24px 0;">
      <p style="margin: 0; color: #4a4a4a; font-size: 15px; line-height: 1.6; font-style: italic;">
        "${commentPreview}"
      </p>
    </div>
    <p style="margin: 0 0 32px 0; text-align: center;">
      <a href="${storyUrl}" style="display: inline-block; background-color: #1a1a1a; color: #f8f7f4; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-size: 15px;">
        View Comment
      </a>
    </p>
  `);

  return sendEmail({
    to,
    subject: `New comment on "${storyTitle}"`,
    html,
  });
}

/**
 * Welcome Email
 */
export async function sendWelcomeEmail({
  to,
  displayName,
}: {
  to: string;
  displayName: string;
}): Promise<EmailResult> {
  const html = baseTemplate(`
    <h2 style="margin: 0 0 24px 0; color: #1a1a1a; font-size: 28px; font-weight: normal;">
      Welcome to People of Cornwall
    </h2>
    <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.7;">
      Hello ${displayName},
    </p>
    <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.7;">
      Welcome to our community archive of Cornish stories and memories. We're so glad you've joined us.
    </p>
    <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.7;">
      People of Cornwall is a living digital museum — a place where the stories of Cornwall's people are preserved for future generations. Every story matters, whether it's a childhood memory, a family tradition, or a moment that shaped your life.
    </p>
    <p style="margin: 0 0 32px 0; text-align: center;">
      <a href="${SITE_URL}/write" style="display: inline-block; background-color: #1a1a1a; color: #f8f7f4; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-size: 15px;">
        Share Your First Story
      </a>
    </p>
    <p style="margin: 0; color: #6b6b6b; font-size: 14px; line-height: 1.6;">
      Or start by <a href="${SITE_URL}/stories" style="color: #1a1a1a;">exploring stories</a> from our community.
    </p>
  `);

  return sendEmail({
    to,
    subject: "Welcome to People of Cornwall",
    html,
  });
}

/**
 * Story Submitted for Review Email (to admin)
 */
export async function sendStorySubmittedEmail({
  to,
  storyTitle,
  authorName,
  storyId,
}: {
  to: string;
  storyTitle: string;
  authorName: string;
  storyId: string;
}): Promise<EmailResult> {
  const reviewUrl = `${SITE_URL}/stories/${storyId}`;
  
  const html = baseTemplate(`
    <h2 style="margin: 0 0 24px 0; color: #1a1a1a; font-size: 28px; font-weight: normal;">
      New story submitted for review
    </h2>
    <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.7;">
      A new story has been submitted and is waiting for your review:
    </p>
    <div style="background-color: #f8f7f4; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 18px; font-weight: bold;">
        ${storyTitle}
      </p>
      <p style="margin: 0; color: #6b6b6b; font-size: 14px;">
        by ${authorName}
      </p>
    </div>
    <p style="margin: 0 0 32px 0; text-align: center;">
      <a href="${reviewUrl}" style="display: inline-block; background-color: #1a1a1a; color: #f8f7f4; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-size: 15px;">
        Review Story
      </a>
    </p>
  `);

  return sendEmail({
    to,
    subject: `New story for review: "${storyTitle}"`,
    html,
  });
}

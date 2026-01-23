import { NextRequest, NextResponse } from "next/server";

interface ModerationResult {
  approved: boolean;
  score: number; // 0.0 to 1.0 (higher = more harmful)
  flags: string[];
  reason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || content.trim().length < 1) {
      return NextResponse.json({
        approved: true,
        score: 0,
        flags: [],
      });
    }

    // Use OpenAI Moderation API (free!) for content moderation
    const moderationResponse = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: content,
      }),
    });

    if (!moderationResponse.ok) {
      console.error("OpenAI Moderation API error:", moderationResponse.status);
      // Fail open - allow the comment through if moderation API fails
      return NextResponse.json({
        approved: true,
        score: 0,
        flags: ["moderation_unavailable"],
      });
    }

    const moderationData = await moderationResponse.json();
    const result = moderationData.results?.[0];

    if (!result) {
      return NextResponse.json({
        approved: true,
        score: 0,
        flags: [],
      });
    }

    // Extract flags from categories
    const flags: string[] = [];
    const categories = result.categories || {};
    const scores = result.category_scores || {};

    // Map OpenAI categories to human-readable flags
    const categoryMap: Record<string, string> = {
      "hate": "hate_speech",
      "hate/threatening": "hate_threatening",
      "harassment": "harassment",
      "harassment/threatening": "harassment_threatening",
      "self-harm": "self_harm",
      "self-harm/intent": "self_harm_intent",
      "self-harm/instructions": "self_harm_instructions",
      "sexual": "sexual_content",
      "sexual/minors": "sexual_minors",
      "violence": "violence",
      "violence/graphic": "violence_graphic",
    };

    // Build flags array from detected categories
    for (const [category, detected] of Object.entries(categories)) {
      if (detected) {
        const flag = categoryMap[category] || category.replace(/[\/\s]/g, "_");
        flags.push(flag);
      }
    }

    // Calculate overall score (max of all category scores)
    const maxScore = Math.max(...Object.values(scores as Record<string, number>), 0);

    // Determine if the comment should be approved
    // We'll flag but still allow borderline content (score 0.3-0.7)
    // Only auto-reject very harmful content (score > 0.7)
    const approved = !result.flagged || maxScore < 0.7;

    // Additional check for spam patterns (not covered by OpenAI)
    const spamPatterns = [
      /\b(buy|sell|click here|free money|act now|limited time)\b/gi,
      /(\b\d{3}[-.]?\d{3}[-.]?\d{4}\b)/g, // Phone numbers
      /(https?:\/\/[^\s]+){3,}/g, // Multiple URLs
      /(.)\1{10,}/g, // Repeated characters (spammy)
    ];

    let isSpammy = false;
    for (const pattern of spamPatterns) {
      if (pattern.test(content)) {
        isSpammy = true;
        flags.push("potential_spam");
        break;
      }
    }

    const response: ModerationResult = {
      approved: approved && !isSpammy,
      score: Math.max(maxScore, isSpammy ? 0.6 : 0),
      flags,
      reason: !approved || isSpammy 
        ? `Content flagged for: ${flags.join(", ")}` 
        : undefined,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Moderation error:", error);
    // Fail open - allow the comment through if there's an error
    return NextResponse.json({
      approved: true,
      score: 0,
      flags: ["moderation_error"],
    });
  }
}

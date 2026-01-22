import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * AI Summary Generation
 * 
 * Generates a summary and tags for a story.
 * Uses OpenAI GPT-3.5/4 or can be adapted for other LLMs.
 */

interface SummaryRequest {
  storyId: string;
  title: string;
  body: string;
}

interface AIResponse {
  summary: string;
  tags: string[];
}

// System prompt for the AI
const SYSTEM_PROMPT = `You are a curator at People of Cornwall, a digital museum preserving Cornish stories and memories.

Your task is to write a brief summary (2-3 sentences, max 200 characters) that captures the essence of the story.
Also extract 3-5 relevant tags that describe the themes, places, time periods, or activities in the story.

Guidelines:
- Write in a warm, respectful tone befitting a museum
- Focus on what makes the story meaningful
- Keep summaries evocative but concise
- Tags should be lowercase, single words or short phrases
- Tags should help people find similar stories

Respond in JSON format:
{
  "summary": "A brief, evocative summary...",
  "tags": ["tag1", "tag2", "tag3"]
}`;

async function generateWithOpenAI(title: string, body: string): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  // Strip HTML from body
  const plainText = body.replace(/<[^>]*>/g, "").trim();
  const truncatedText = plainText.slice(0, 3000); // Limit to ~3000 chars

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Title: ${title}\n\nStory:\n${truncatedText}` },
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI error:", error);
    throw new Error("Failed to generate summary");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from AI");
  }

  // Parse JSON response
  try {
    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary || "",
      tags: parsed.tags || [],
    };
  } catch {
    // If JSON parsing fails, try to extract summary from text
    return {
      summary: content.slice(0, 200),
      tags: [],
    };
  }
}

// Fallback: simple extraction without AI
function generateFallback(title: string, body: string): AIResponse {
  // Strip HTML
  const plainText = body.replace(/<[^>]*>/g, "").trim();
  
  // Take first ~150 chars as summary
  const summary = plainText.slice(0, 150).trim() + (plainText.length > 150 ? "..." : "");
  
  // Extract potential tags from common Cornwall-related words
  const tagPatterns = [
    // Places
    /\b(penzance|falmouth|truro|newquay|st ives|padstow|bodmin|lizard|lands end|cornwall)\b/gi,
    // Activities
    /\b(fishing|mining|farming|surfing|sailing|swimming)\b/gi,
    // Time periods
    /\b(1940s|1950s|1960s|1970s|1980s|1990s|war|childhood|school)\b/gi,
    // Themes
    /\b(family|community|tradition|sea|beach|harbour|village|church)\b/gi,
  ];

  const foundTags = new Set<string>();
  for (const pattern of tagPatterns) {
    const matches = plainText.match(pattern) || [];
    matches.forEach((m) => foundTags.add(m.toLowerCase()));
  }

  return {
    summary,
    tags: Array.from(foundTags).slice(0, 5),
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const { storyId, title, body } = await request.json() as SummaryRequest;

    if (!storyId || !title || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify user owns this story
    const { data: story, error: storyError } = await (supabase
      .from("stories") as any)
      .select("author_id")
      .eq("id", storyId)
      .single();

    if (storyError || story?.author_id !== user.id) {
      return NextResponse.json({ error: "Story not found or not authorized" }, { status: 403 });
    }

    let result: AIResponse;

    // Try AI generation, fall back to simple extraction
    try {
      if (process.env.OPENAI_API_KEY) {
        result = await generateWithOpenAI(title, body);
      } else {
        result = generateFallback(title, body);
      }
    } catch (aiError) {
      console.warn("AI generation failed, using fallback:", aiError);
      result = generateFallback(title, body);
    }

    // Update story with summary and tags
    const { error: updateError } = await (supabase
      .from("stories") as any)
      .update({
        ai_summary: result.summary,
        ai_tags: result.tags,
      })
      .eq("id", storyId);

    if (updateError) {
      console.error("Failed to update story:", updateError);
      return NextResponse.json({ error: "Failed to save summary" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      summary: result.summary,
      tags: result.tags,
    });

  } catch (error) {
    console.error("Summary generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}

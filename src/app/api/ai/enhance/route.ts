import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { content, title, mode } = await request.json();

    if (!content || content.trim().length < 50) {
      return NextResponse.json(
        { error: "Please write at least a few sentences before enhancing" },
        { status: 400 }
      );
    }

    // Strip HTML tags for processing
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Different prompts for different enhancement modes
    const prompts: Record<string, string> = {
      polish: `You are an editor for a Cornish heritage storytelling platform called "People of Cornwall". 
Your job is to polish and enhance personal stories while preserving the author's authentic voice and memories.

Guidelines:
- Keep the personal, first-person narrative style
- Preserve all specific details, names, places, and memories
- Fix grammar and spelling naturally
- Improve flow and readability
- Keep the Cornish character and any dialect words
- Make it more engaging to read while staying true to the original
- Do NOT add fictional details or embellishments
- Do NOT make it sound corporate or formal
- Keep it warm, personal, and human

Here is the story to polish:

Title: ${title || "Untitled"}

${plainText}

Please return ONLY the enhanced story text, without any preamble or explanation.`,

      expand: `You are an editor for a Cornish heritage storytelling platform called "People of Cornwall".
The author has written a short piece and would like help expanding it into a fuller story.

Guidelines:
- Ask yourself what details might make this more vivid
- Suggest sensory details (what did it smell like? sound like? feel like?)
- Keep the author's voice and perspective
- Add transitional sentences for better flow
- Keep it authentic to Cornish culture and history
- Do NOT invent specific facts, names, or events
- Use phrases like "perhaps" or "I remember" when adding atmosphere
- Keep it warm, personal, and engaging

Here is the story to expand:

Title: ${title || "Untitled"}

${plainText}

Please return ONLY the expanded story text, without any preamble or explanation.`,

      simplify: `You are an editor for a Cornish heritage storytelling platform called "People of Cornwall".
The author would like their story simplified and made easier to read.

Guidelines:
- Use shorter sentences
- Break up long paragraphs
- Keep all the important details and memories
- Make it accessible for all readers
- Preserve the author's voice
- Keep any Cornish dialect or local terms (they add character)
- Keep it warm and personal

Here is the story to simplify:

Title: ${title || "Untitled"}

${plainText}

Please return ONLY the simplified story text, without any preamble or explanation.`,
    };

    const systemPrompt = prompts[mode] || prompts.polish;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: systemPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status, response.statusText);
      return NextResponse.json(
        { error: "AI service temporarily unavailable. Please try again." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const enhancedContent = data.choices?.[0]?.message?.content?.trim();

    if (!enhancedContent) {
      return NextResponse.json(
        { error: "Failed to enhance story" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      enhanced: enhancedContent,
      mode,
    });

  } catch (error) {
    console.error("AI enhancement error:", error);
    return NextResponse.json(
      { error: "Failed to enhance story. Please try again." },
      { status: 500 }
    );
  }
}

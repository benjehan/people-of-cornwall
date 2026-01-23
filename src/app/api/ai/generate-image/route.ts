import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Master style prompt for Cornish heritage aesthetic
const STYLE_PROMPT = `Style: Cornish heritage illustration, reminiscent of works found in a digital museum archive. 
The image should have a painterly quality with subtle grain texture, like a cherished photograph from a family album or a watercolor painting from a local gallery.
Color palette: muted earth tones, sea greens, slate grays, and warm copper accents reflecting Cornwall's landscape.
NOT photorealistic, NOT cartoon, NOT anime. Think: British heritage illustration, museum archive quality, nostalgic and timeless.
The image should evoke the feeling of Kernow (Cornwall) - the rugged coastline, fishing villages, mining heritage, and community spirit.`;

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

    const { storyContent, storyTitle, customPrompt, imageStyle } = await request.json();

    // Build the prompt
    let userPrompt = customPrompt;

    // If no custom prompt, generate one from the story
    if (!userPrompt && storyContent) {
      // First, use GPT to suggest a good image prompt based on the story
      const suggestResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are helping create image prompts for a Cornish heritage storytelling platform.
Based on the story provided, suggest a single evocative image that would illustrate it well.
Focus on: scenes, landscapes, objects, or moments mentioned in the story.
Be specific and visual. Keep your response to 2-3 sentences maximum.
Do NOT include any style instructions - just describe WHAT should be in the image.`
            },
            {
              role: "user",
              content: `Story title: "${storyTitle || 'Untitled'}"\n\nStory content:\n${storyContent.slice(0, 2000)}`
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (suggestResponse.ok) {
        const suggestData = await suggestResponse.json();
        userPrompt = suggestData.choices?.[0]?.message?.content?.trim();
      }
    }

    if (!userPrompt) {
      return NextResponse.json(
        { error: "Please provide a description for the image or write some story content first" },
        { status: 400 }
      );
    }

    // Determine style modifier based on user selection
    let styleModifier = "";
    switch (imageStyle) {
      case "painting":
        styleModifier = "Oil painting style, visible brushstrokes, rich textures.";
        break;
      case "watercolor":
        styleModifier = "Watercolor illustration style, soft edges, flowing colors.";
        break;
      case "vintage":
        styleModifier = "Vintage photograph style, sepia tones, aged paper texture, early 20th century feel.";
        break;
      case "sketch":
        styleModifier = "Pencil or charcoal sketch style, detailed line work, artistic illustration.";
        break;
      default:
        styleModifier = "Heritage illustration style, classic and timeless.";
    }

    // Combine user prompt with master style
    const fullPrompt = `${userPrompt}\n\n${STYLE_PROMPT}\n${styleModifier}`;

    // Generate image using DALL-E 3
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: fullPrompt,
        n: 1,
        size: "1792x1024", // Landscape format for stories
        quality: "standard",
        style: "vivid",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("DALL-E API error:", errorData);
      
      if (errorData.error?.code === "content_policy_violation") {
        return NextResponse.json(
          { error: "The image description was flagged by our safety filter. Please try a different description." },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to generate image. Please try again." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;
    const revisedPrompt = data.data?.[0]?.revised_prompt;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageUrl,
      revisedPrompt,
      suggestedPrompt: userPrompt,
    });

  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate image. Please try again." },
      { status: 500 }
    );
  }
}

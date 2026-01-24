import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Base context for Cornwall-themed images
const CORNWALL_CONTEXT = `Setting: Cornwall, UK (Kernow) - evoke the feeling of rugged coastline, fishing villages, mining heritage, and community spirit.
Color palette inspiration: muted earth tones, sea greens, slate grays, and warm copper accents reflecting Cornwall's landscape.`;

const FREE_CREDITS = 5; // Free AI image generations per user

// Style-specific prompts that completely define the look
const STYLE_PROMPTS: Record<string, string> = {
  heritage: `Art style: British heritage illustration, museum archive quality, nostalgic and timeless.
The image should have a painterly quality with subtle grain texture.
NOT photorealistic, NOT cartoon, NOT anime. Think: classic illustration from a local history book.`,
  
  painting: `Art style: Traditional oil painting with clearly visible brushstrokes and rich impasto textures.
Rich, saturated colors with depth. Canvas texture visible. Classical painting technique like the Newlyn School artists.
Must look like an actual oil painting, NOT digital art, NOT illustration.`,
  
  watercolor: `Art style: Delicate watercolor painting with soft, flowing edges and transparent color washes.
Visible paper texture, colors bleeding into each other naturally. Wet-on-wet technique.
Light and airy feel. Must look like a genuine watercolor painting, NOT digital.`,
  
  vintage: `Art style: Authentic vintage photograph from the 1920s-1950s era.
Sepia or faded color tones, slight vignetting, aged paper texture with subtle scratches and wear.
Grainy film quality, slightly soft focus. Must look like a real old photograph, NOT a painting or illustration.`,
  
  sketch: `Art style: Hand-drawn pencil or charcoal sketch on textured paper.
Detailed line work, cross-hatching for shading, visible pencil strokes.
Artistic illustration style like a field sketch or artist's study. NOT digital, NOT clean lines.`,
};

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

    // Check user's credits and admin status using admin client (bypasses RLS)
    const adminClient = createAdminClient();
    
    if (!adminClient) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const { data: userProfile } = await adminClient
      .from("users")
      .select("role, ai_image_credits, ai_images_generated")
      .eq("id", user.id)
      .single();

    const isAdmin = userProfile?.role === "admin";
    const credits = userProfile?.ai_image_credits ?? FREE_CREDITS;

    // Check if user has credits (admins have unlimited)
    if (!isAdmin && credits <= 0) {
      return NextResponse.json(
        { 
          error: "You've used all your free AI image credits! Contact us if you'd like more.",
          creditsRemaining: 0,
        },
        { status: 403 }
      );
    }

    const { storyContent, storyTitle, customPrompt, imageStyle, prompt, style, storyId, insertIntoStory } = await request.json();
    
    // Support both old and new param names
    const actualPrompt = customPrompt || prompt;
    const actualStyle = imageStyle || style || "heritage";
    const actualContent = storyContent || (storyTitle ? `Title: ${storyTitle}` : null);

    // Build the prompt
    let userPrompt = actualPrompt;

    // If no custom prompt, generate one from the story
    if (!userPrompt && actualContent) {
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
              content: `Story title: "${storyTitle || 'Untitled'}"\n\nStory content:\n${actualContent.slice(0, 2000)}`
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

    // Get the style-specific prompt (defaults to heritage)
    const stylePrompt = STYLE_PROMPTS[actualStyle] || STYLE_PROMPTS.heritage;

    // Build full prompt: Style instructions FIRST (most important), then subject, then context
    const fullPrompt = `${stylePrompt}

Subject: ${userPrompt}

${CORNWALL_CONTEXT}`;

    console.log("Generating image with style:", actualStyle);
    console.log("Full prompt:", fullPrompt);

    // Choose DALL-E style parameter based on selected style
    // "natural" is better for vintage photos and sketches, "vivid" for paintings
    const dalleStyle = (actualStyle === "vintage" || actualStyle === "sketch") ? "natural" : "vivid";

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
        style: dalleStyle,
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
    const tempImageUrl = data.data?.[0]?.url;
    const revisedPrompt = data.data?.[0]?.revised_prompt;

    if (!tempImageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    // Download the image from DALL-E (server-side avoids CORS issues)
    const imageResponse = await fetch(tempImageUrl);
    if (!imageResponse.ok) {
      console.error("Failed to download DALL-E image");
      return NextResponse.json(
        { error: "Failed to download generated image" },
        { status: 500 }
      );
    }

    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageUint8Array = new Uint8Array(imageArrayBuffer);
    
    // Upload to Supabase Storage (using admin client to bypass RLS)
    const fileName = `${user.id}/ai-generated/ai-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from("story-media")
      .upload(fileName, imageUint8Array, {
        cacheControl: "3600",
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError.message, uploadError);
      return NextResponse.json(
        { error: `Failed to save generated image: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get permanent public URL
    const { data: { publicUrl } } = adminClient.storage
      .from("story-media")
      .getPublicUrl(uploadData.path);

    // Decrement credits and increment total generated (only for non-admins)
    if (!isAdmin) {
      await adminClient
        .from("users")
        .update({ 
          ai_image_credits: credits - 1,
          ai_images_generated: (userProfile?.ai_images_generated || 0) + 1,
        })
        .eq("id", user.id);
    } else {
      // Still track admin generations for analytics
      await adminClient
        .from("users")
        .update({ 
          ai_images_generated: (userProfile?.ai_images_generated || 0) + 1,
        })
        .eq("id", user.id);
    }

    const creditsRemaining = isAdmin ? -1 : credits - 1; // -1 means unlimited

    // If insertIntoStory is true, update the story body with the new image
    if (insertIntoStory && storyId) {
      const { data: story } = await adminClient
        .from("stories")
        .select("body")
        .eq("id", storyId)
        .single();

      if (story) {
        const imageHtml = `<p><img src="${publicUrl}" alt="AI generated illustration for ${storyTitle || 'this story'}" style="max-width: 100%; height: auto;" /></p>`;
        // Insert image at the beginning of the story body
        const newBody = imageHtml + (story.body || "");
        
        await adminClient
          .from("stories")
          .update({ body: newBody })
          .eq("id", storyId);
      }
    }

    return NextResponse.json({
      imageUrl: publicUrl, // Now returns permanent Supabase URL
      revisedPrompt,
      suggestedPrompt: userPrompt,
      creditsRemaining,
    });

  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate image. Please try again." },
      { status: 500 }
    );
  }
}

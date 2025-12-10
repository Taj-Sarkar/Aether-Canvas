import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const STABILITY_API_KEY = process.env.STABILITY_API_KEY || process.env.STABILITY_AI_API_KEY || "";
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || "";

async function generateWithOpenAI(prompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || "OpenAI image generation failed");
  }

  const data = await response.json();
  return data.data[0]?.url || "";
}

async function generateWithStability(prompt: string): Promise<string> {
  const response = await fetch("https://api.stability.ai/v2beta/stable-image/generate/core", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${STABILITY_API_KEY}`,
      "Accept": "image/*",
    },
    body: JSON.stringify({
      prompt: prompt,
      output_format: "png",
      aspect_ratio: "1:1",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stability AI error: ${error}`);
  }

  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:image/png;base64,${base64}`;
}

async function generateWithReplicate(prompt: string): Promise<string> {
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Token ${REPLICATE_API_TOKEN}`,
    },
    body: JSON.stringify({
      version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", // stable-diffusion-xl
      input: {
        prompt: prompt,
        width: 1024,
        height: 1024,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Replicate image generation failed");
  }

  const data = await response.json();
  
  // Poll for completion
  let result = data;
  while (result.status === "starting" || result.status === "processing") {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
      },
    });
    result = await statusResponse.json();
  }

  if (result.status === "succeeded" && result.output?.[0]) {
    return result.output[0];
  }
  
  throw new Error("Replicate generation failed");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body || {};

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    let imageUrl = "";
    let provider = "";

    // Try providers in order of preference
    if (OPENAI_API_KEY) {
      try {
        imageUrl = await generateWithOpenAI(prompt);
        provider = "openai";
      } catch (e: any) {
        console.error("OpenAI generation failed:", e.message);
      }
    }

    if (!imageUrl && STABILITY_API_KEY) {
      try {
        imageUrl = await generateWithStability(prompt);
        provider = "stability";
      } catch (e: any) {
        console.error("Stability AI generation failed:", e.message);
      }
    }

    if (!imageUrl && REPLICATE_API_TOKEN) {
      try {
        imageUrl = await generateWithReplicate(prompt);
        provider = "replicate";
      } catch (e: any) {
        console.error("Replicate generation failed:", e.message);
      }
    }

    if (!imageUrl) {
      return NextResponse.json({ 
        error: "No image generation API configured. Please add OPENAI_API_KEY, STABILITY_API_KEY, or REPLICATE_API_TOKEN to your .env file." 
      }, { status: 500 });
    }

    return NextResponse.json({ imageUrl, provider });
  } catch (error: any) {
    console.error("Image generation error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}


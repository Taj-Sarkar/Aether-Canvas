import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { getDb } from "@/lib/mongodb";

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

const ensureClient = () => {
  if (!apiKey) {
    throw new Error("Gemini API key missing");
  }
  return new GoogleGenAI({ apiKey });
};

const cleanText = (text: string) => text.replace(/^```json\s*/, "").replace(/\s*```$/, "");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body || {};
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: "GEMINI_API_KEY not configured. Please add GEMINI_API_KEY to your .env file." 
      }, { status: 500 });
    }
    
    const ai = ensureClient();
    const db = await getDb();

    switch (action) {
      case "analyzeText": {
        const schema = {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["summary", "keyPoints", "tags", "actionItems"],
        };

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Analyze the following chaotic notes and structure them. \n\n${payload?.text || ""}`,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        });
        const result = JSON.parse(cleanText(response.text || "{}"));

        if (db) {
          db.collection("gemini_logs").insertOne({
            action: "analyzeText",
            createdAt: new Date(),
            inputLength: (payload?.text || "").length,
            output: result,
          }).catch(() => {});
        }

        return NextResponse.json(result);
      }

      case "analyzeImage": {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: {
            parts: [
              { inlineData: { data: payload?.base64Data, mimeType: payload?.mimeType } },
              { text: (payload?.prompt || "Analyze this image.") + "\n\nProvide a structured analysis in Markdown with the following sections:\n### Summary\nBrief overview of the image.\n\n### Key Visual Elements\nList of main objects, colors, and composition details.\n\n### Detected Text\nAny visible text in the image (or 'None').\n\n### Key Insights\nInterpretation or meaning of the image." },
            ],
          },
        });
        const text = response.text || "No analysis generated.";

        if (db) {
          db.collection("gemini_logs").insertOne({
            action: "analyzeImage",
            createdAt: new Date(),
            mimeType: payload?.mimeType,
            prompt: payload?.prompt,
            output: text,
          }).catch(() => {});
        }

        return NextResponse.json({ text });
      }

      case "chartRecommendation": {
        const schema = {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["bar", "line", "area", "pie"] },
            title: { type: Type.STRING },
            xAxisKey: { type: Type.STRING },
            dataKey: { type: Type.STRING },
            data: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                },
                required: ["name", "value"],
              },
            },
          },
          required: ["type", "title", "data", "xAxisKey", "dataKey"],
        };

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Generate a visualization based on this dataset description: "${payload?.datasetDescription}". Create realistic mock data points to visualize it.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        });
        const result = JSON.parse(cleanText(response.text || "{}"));

        if (db) {
          db.collection("gemini_logs").insertOne({
            action: "chartRecommendation",
            createdAt: new Date(),
            description: payload?.datasetDescription,
            output: result,
          }).catch(() => {});
        }

        return NextResponse.json(result);
      }

      case "chat": {
        try {
          const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: {
              systemInstruction: `You are a friendly, teacher-like AI assistant helping users learn and organize information in their workspace.

WORKSPACE CONTEXT:
${payload?.context || "No workspace context available."}

CORE PRINCIPLES:

1. SIMPLE EXPLANATIONS FIRST
   - Always start with a 1-2 sentence simple explanation ("Explain like I'm 12" vibe)
   - Then break into structured sections with clear headings:
     • What it is
     • Why it matters
     • How it works (step by step)
     • Real-life analogy
     • Common pitfalls / misconceptions
   - Highlight key terms and points clearly (use **bold** or bullet points)
   - Avoid jargon unless necessary; if used, define it simply

2. HANDLING IMAGES & DATASETS
   When images are mentioned or uploaded:
   - Understand what the image contains (charts, text, diagrams, UI, etc.)
   - Extract and use any text or data visible in the image
   - Explain: what it shows, how it connects to the concept/question, important patterns/steps/labels
   - Suggest useful visuals: "A simple flowchart showing A → B → C..." or "A bar chart comparing X, Y, and Z..."

   When datasets/tables are mentioned or uploaded:
   - Infer structure (rows, columns, what each column means)
   - Summarize key patterns, trends, or outliers
   - Suggest appropriate visualizations:
     • Line chart for trends over time
     • Bar chart for category comparisons
     • Pie chart only for few, mutually exclusive categories
   - Clearly state which variables go on which axis and what can be learned

3. AGENTIC COLLABORATION APPROACH
   Think through each request as a team:
   - Question & Notes Agent: Identify what user wants, which notes/images/data are relevant
   - Concept Breakdown Agent: Build structured explanation with sections and key points
   - Visual & Data Agent: Add/suggest charts, diagrams, visual explanations using uploaded content
   - Flashcard Agent: Extract important ideas into flashcards (only when requested)
   - Provide a single, clean response that integrates all insights (not separate responses)

4. FLASHCARD GENERATION
   When user asks for flashcards:
   - Identify most important concepts, definitions, formulas, or steps from current explanation, pinned notes, analyzed images/data
   - Create short, focused flashcards (one idea per card)
   - Format:
     Front: Clear question, cue, or fill-in-the-blank
     Back: Concise answer with optional tiny explanation/example
     Image_prompt: Concrete, helpful illustration idea
   - Prioritize: core definitions, key formulas, critical steps, common pitfalls

5. OUTPUT STYLE & TONE
   - Be friendly, calm, and teacher-like
   - Use short paragraphs, bullet points, and headings
   - Prefer plain language, especially for difficult topics
   - For complex topics: show in layers (simple first, then deeper technical details)
   - Don't assume user remembers previous context; briefly reconnect when useful

6. WHEN UNSURE
   - Make reasonable assumptions and state them (e.g., "I'll assume your dataset is about...")
   - Continue with the best possible helpful answer based on available context

IMPORTANT: Use workspace context when relevant, but always answer the user's question even if context is missing or unrelated. Be helpful, clear, and educational.`,
            },
            history: (payload?.history || []).map((h: any) => ({ role: h.role, parts: [{ text: h.content }] })),
          });

          const response = await chat.sendMessage({ message: payload?.newMessage || "" });
          const text = response.text;

          if (db) {
            db.collection("chat_logs").insertOne({
              createdAt: new Date(),
              context: payload?.context,
              history: payload?.history,
              userMessage: payload?.newMessage,
              modelResponse: text,
            }).catch(() => {});
          }

          return NextResponse.json({ text });
        } catch (chatError: any) {
          console.error("Chat error:", chatError);
          throw new Error(chatError?.message || "Failed to generate chat response");
        }
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Gemini API route error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}


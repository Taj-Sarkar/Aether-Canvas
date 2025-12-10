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
          required: ["summary", "keyPoints", "tags"],
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
              { text: payload?.prompt || "Describe this image in detail and extract any visible text." },
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
        const chat = ai.chats.create({
          model: "gemini-2.5-flash",
          config: {
            systemInstruction: `You are an AI assistant in a workspace.
            You have workspace context (notes, images, datasets) when provided:
            ${payload?.context || ""}

            Use the context when it is relevant, but if it is missing or unrelated
            still answer the user's question as best you can. Be concise and helpful.`,
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
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Gemini API route error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}


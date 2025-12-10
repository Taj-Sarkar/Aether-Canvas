import { GoogleGenAI, Type } from "@google/genai";
import { BreakdownData, ChartConfig } from "../types";

const apiKey = process.env.API_KEY || '';
const hasApiKey = Boolean(apiKey);
const ai = hasApiKey ? new GoogleGenAI({ apiKey }) : null;

// Lightweight mock helpers so the demo still works without a key
const mockDelay = (ms = 500) => new Promise((r) => setTimeout(r, ms));
const fallbackBreakdown: BreakdownData = {
  summary:
    "This is a demo summary. Provide a Gemini API key to see live analysis.",
  keyPoints: [
    "Key points will appear here once the Gemini API key is configured.",
    "You can still edit notes, upload images, and add datasets.",
  ],
  actionItems: [
    "Add your Gemini API key to a .env file as GEMINI_API_KEY.",
    "Reload the page to enable real AI responses.",
  ],
  tags: ["demo", "setup-needed"],
};
const fallbackChart: ChartConfig = {
  type: "bar",
  title: "Demo Sales by Region",
  xAxisKey: "name",
  dataKey: "value",
  data: [
    { name: "North", value: 120 },
    { name: "South", value: 98 },
    { name: "East", value: 86 },
    { name: "West", value: 142 },
  ],
};

export const isApiConfigured = hasApiKey;

// Helper to remove code fences if present in text response
const cleanText = (text: string) => {
  return text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
};

export const analyzeTextStructure = async (text: string): Promise<BreakdownData> => {
  if (!hasApiKey || !ai) {
    console.warn("Gemini API key missing - returning fallback breakdown");
    await mockDelay();
    return {
      ...fallbackBreakdown,
      summary: text ? `Demo summary for: ${text.slice(0, 120)}...` : fallbackBreakdown.summary,
    };
  }

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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following chaotic notes and structure them. \n\n${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const result = JSON.parse(cleanText(response.text || "{}"));
    return result as BreakdownData;
  } catch (error) {
    console.error("Gemini Text Analysis Error:", error);
    throw error;
  }
};

export const analyzeImage = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
  if (!hasApiKey || !ai) {
    console.warn("Gemini API key missing - returning fallback image analysis");
    await mockDelay();
    return "Demo analysis: Configure GEMINI_API_KEY to enable real image insights.";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using flash for speed/multimodal
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: prompt || "Describe this image in detail and extract any visible text." }
        ]
      }
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Image Analysis Error:", error);
    throw error;
  }
};

export const generateChartRecommendation = async (datasetDescription: string): Promise<ChartConfig> => {
  if (!hasApiKey || !ai) {
    console.warn("Gemini API key missing - returning fallback chart config");
    await mockDelay();
    return {
      ...fallbackChart,
      title: `Demo: ${datasetDescription || fallbackChart.title}`,
    };
  }

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
            value: { type: Type.NUMBER }
          },
          required: ["name", "value"]
        }
      }
    },
    required: ["type", "title", "data", "xAxisKey", "dataKey"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a visualization based on this dataset description: "${datasetDescription}". Create realistic mock data points to visualize it.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const result = JSON.parse(cleanText(response.text || "{}"));
    return result as ChartConfig;
  } catch (error) {
    console.error("Gemini Chart Generation Error:", error);
    throw error;
  }
};

export const chatWithWorkspace = async (
  history: {role: 'user' | 'model', content: string}[], 
  newMessage: string,
  context: string
) => {
  if (!hasApiKey || !ai) {
    console.warn("Gemini API key missing - returning fallback chat response");
    await mockDelay();
    return `Demo response (no API key yet). You asked: "${newMessage}".\n\nAdd GEMINI_API_KEY to enable real chat.`;
  }

  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `You are an AI assistant in a workspace. 
        Here is the context of the current workspace (notes, images, datasets):
        ${context}
        
        Answer the user's questions based on this context. Be concise and helpful.`,
      },
      history: history.map(h => ({ role: h.role, parts: [{ text: h.content }] }))
    });

    const response = await chat.sendMessage({ message: newMessage });
    return response.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
};

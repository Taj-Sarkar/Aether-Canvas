import { BreakdownData, ChartConfig } from "../types";

type ChatHistory = { role: "user" | "model"; content: string }[];

const postJson = async <T>(action: string, payload: any): Promise<T> => {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gemini request failed");
  }
  return res.json();
};

export const isApiConfigured = true; // API key is handled server-side in the Next route

export const analyzeTextStructure = async (text: string): Promise<BreakdownData> => {
  return postJson<BreakdownData>("analyzeText", { text });
};

export const analyzeImage = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
  const res = await postJson<{ text: string }>("analyzeImage", { base64Data, mimeType, prompt });
  return res.text;
};

export const generateChartRecommendation = async (datasetDescription: string): Promise<ChartConfig> => {
  return postJson<ChartConfig>("chartRecommendation", { datasetDescription });
};

export const chatWithWorkspace = async (
  history: ChatHistory,
  newMessage: string,
  context: string
) => {
  const res = await postJson<{ text: string }>("chat", { history, newMessage, context });
  return res.text;
};

export const generateImage = async (prompt: string): Promise<string> => {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Image generation failed");
  }
  const data = await res.json();
  return data.imageUrl;
};


import { GoogleGenAI } from "@google/genai";
import { ChatbotConfig, Message } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async generateResponse(config: ChatbotConfig, userMessage: string, history: Message[]): Promise<string> {
    const activeKeyPoints = config.keyPoints
      .filter(kp => kp.active)
      .map(kp => `- ${kp.title}: ${kp.content}`)
      .join('\n');

    const systemPrompt = `
      You are an AI assistant for a LINE Official Account.
      Bot Name: ${config.botName}
      Persona: ${config.persona}
      Primary Language: ${config.language}

      Important Information to convey when relevant:
      ${activeKeyPoints}

      Guidelines:
      1. Be concise (LINE messages are read on mobile).
      2. If the user asks something not related to the Key Points, answer naturally based on your persona.
      3. Always try to lead the user towards the Key Points if it feels natural.
      4. Use emojis occasionally to feel friendly (LINE style).
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      return response.text || "抱歉，我現在無法回應。";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "發生錯誤，請稍後再試。";
    }
  }
}

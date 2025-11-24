import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { fileToBase64, getMimeType } from "../utils/fileUtils";

// Initialize the API client
// Ideally, this should be inside a class or hook to handle key changes, but for simplicity/env usage:
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export class GeminiService {
  private chat: Chat;

  constructor() {
    this.chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "You are a helpful, concise, and friendly AI assistant. You answer questions clearly. If the user provides an image, analyze it helpfully.",
      },
    });
  }

  async sendMessageStream(
    messageText: string,
    imageFile: File | null,
    onChunk: (text: string) => void
  ): Promise<void> {
    
    let messageContent: any = messageText;

    // Handle Image Input
    if (imageFile) {
      const base64Data = await fileToBase64(imageFile);
      const mimeType = getMimeType(imageFile);
      
      messageContent = [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          }
        },
        {
          text: messageText || "What is this image?",
        }
      ];
    }

    try {
      const resultStream = await this.chat.sendMessageStream({
        message: messageContent
      });

      for await (const chunk of resultStream) {
        const responseChunk = chunk as GenerateContentResponse;
        if (responseChunk.text) {
          onChunk(responseChunk.text);
        }
      }
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      throw error;
    }
  }
}

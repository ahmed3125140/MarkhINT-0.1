
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { PersonalizationSettings, AspectRatio } from "../types";

export class GeminiService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateChatResponse(
    message: string, 
    model: string = 'gemini-3-pro-preview',
    customSystemInstruction?: string,
    personalization?: PersonalizationSettings,
    isThinking: boolean = false
  ) {
    const ai = this.getAI();

    let finalSystemInstruction = (customSystemInstruction || "You are MarkhINT 0.1, a stoic and powerful strategic intelligence asset.") + 
      "\n\nIDENTITY: High-frequency multimodal processor. Always provide structured, comprehensive answers.";

    if (personalization) {
      finalSystemInstruction += `\n\nBEHAVIORAL CALIBRATION:
      - Base Tone: ${personalization.baseStyle}
      - Warmth: ${personalization.warmth}
      - Custom Directives: ${personalization.customInstructions}`;
    }

    const config: any = {
      systemInstruction: finalSystemInstruction,
      tools: [{ googleSearch: {} }],
      temperature: 0.7
    };

    if (isThinking) {
      config.thinkingConfig = { thinkingBudget: 16000 };
      config.maxOutputTokens = 20000;
    }

    const chat = ai.chats.create({
      model,
      config
    });

    const response = await chat.sendMessage({ message });
    return response;
  }

  async generateImage(
    prompt: string, 
    aspectRatio: AspectRatio = "1:1",
    previousImageBase64?: string
  ) {
    const ai = this.getAI();
    const parts: any[] = [];

    if (previousImageBase64) {
      const base64Data = previousImageBase64.includes(',') ? previousImageBase64.split(',')[1] : previousImageBase64;
      parts.push({
        inlineData: { 
          mimeType: 'image/png', 
          data: base64Data 
        }
      });
      parts.push({ text: `Modify this image based on the following instruction: ${prompt}. Maintain the original context but apply the requested changes accurately.` });
    } else {
      parts.push({ text: `Cinematic tactical render: ${prompt}. Sharp detail, professional photography, dark atmosphere.` });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: { imageConfig: { aspectRatio } }
    });

    let imageUrl = '';
    const contentParts = response.candidates?.[0]?.content?.parts || [];
    for (const part of contentParts) {
      if (part.inlineData?.data) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
    return imageUrl;
  }

  async generateVideo(prompt: string, aspectRatio: "16:9" | "9:16" = "16:9") {
    // Re-initialize AI right before call to ensure latest key from possible picker dialog
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic intelligence footage: ${prompt}`,
      config: { 
        resolution: '720p', 
        aspectRatio 
      }
    });
    while (!operation.done) {
      await new Promise(r => setTimeout(r, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }
}

export const geminiService = new GeminiService();

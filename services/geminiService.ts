import { GoogleGenAI } from "@google/genai";
import { GEMINI_IMAGE_MODEL } from "../constants";

export const generatePixelArtImage = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Enhance prompt to ensure pixel art style suitable for downscaling
  const enhancedPrompt = `
    Create a high quality pixel art sprite of: ${prompt}.
    Style: 16-bit retro game asset, clean lines, solid flat colors, white background.
    Make it suitable for being downscaled to a 16x16 grid.
    Center the subject.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: {
        parts: [
          { text: enhancedPrompt }
        ]
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1",
            // imageSize is only supported by gemini-3-pro-image-preview, not 2.5-flash-image
        }
      }
    });

    let textContent = '';

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
        if (part.text) {
            textContent += part.text;
        }
    }
    
    throw new Error(textContent || "No image data found in response");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
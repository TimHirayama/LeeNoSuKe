import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export class GeminiService {
  /**
   * 共用的 Gemini 呼叫方法，允許傳入自訂的 System Instruction 與是否強制回傳 JSON
   */
  static async generate(
    prompt: string,
    systemInstruction?: string,
    jsonMode: boolean = false
  ): Promise<string> {
    const modelOptions: any = {
      model: process.env.GEMINI_MODEL || "gemini-flash-latest",
    };

    if (systemInstruction) {
      modelOptions.systemInstruction = systemInstruction;
    }

    if (jsonMode) {
      modelOptions.generationConfig = { responseMimeType: "application/json" };
    }

    const model = genAI.getGenerativeModel(modelOptions);
    
    try {
      console.time(`[Gemini API] ${prompt.substring(0, 15)}...`);
      const result = await model.generateContent(prompt);
      console.timeEnd(`[Gemini API] ${prompt.substring(0, 15)}...`);
      return result.response.text().trim();
    } catch (e) {
      console.error("Gemini API Error:", e);
      throw e;
    }
  }
}

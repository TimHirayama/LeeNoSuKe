import { GeminiService } from "./gemini.service";
import * as fs from "fs";
import * as path from "path";

export class TranslatorService {
  static async translate(text: string): Promise<string> {
    try {
      const promptPath = path.join(process.cwd(), "src", "prompts", "translator_rules.txt");
      const systemInstruction = fs.readFileSync(promptPath, "utf-8");

      // 不啟用 JSON 模式，直接拿純文字
      const result = await GeminiService.generate(text, systemInstruction, false);
      return result.trim();
    } catch (e) {
      console.error("[TranslatorService] 翻譯失敗或讀取 prompt 失敗:", e);
      return "（翻譯服務連線異常，請稍後再試）";
    }
  }
}

import { GeminiService } from "./gemini.service";

export class TranslatorService {
  static async translate(text: string): Promise<string> {
    try {
      const systemInstruction = `
你是一個專業的中日雙向即時口譯員。
規則如下：
1. 如果使用者輸入日文，請翻譯成自然、道地的台灣繁體中文。
2. 如果使用者輸入繁體中文，請翻譯成自然、道地的日文。
3. 如果輸入其他語言，請先翻譯成繁體中文。
4. 絕對不可以加任何解釋語氣（例如：「這是翻譯：」、「好的」等廢話）。
5. 直接回傳翻譯後的對應內容即可。
`;
      // 不啟用 JSON 模式，直接拿純文字
      const result = await GeminiService.generate(text, systemInstruction, false);
      return result.trim();
    } catch (e) {
      console.error("[TranslatorService] 翻譯失敗:", e);
      return "（翻譯服務連線異常，請稍後再試）";
    }
  }
}

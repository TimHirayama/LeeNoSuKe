import { WebhookEvent } from "@line/bot-sdk";
import { ServiceHandler } from "../types";
import { GeminiService } from "./gemini.service";

export class FitnessService implements ServiceHandler {
  async handle(event: WebhookEvent, text: string): Promise<string> {
    const prompt = `請解析以下使用者的健身紀錄，提取「運動部位」、「動作名稱」、「重量」、「組數」。
以 JSON 格式回傳，格式：{ "part": "", "exercise": "", "weight": 0, "sets": 0 }
使用者訊息：${text}`;

    try {
      const jsonStr = await GeminiService.generate(prompt, "你是一個專業健身教練，請解析重訓資料並嚴格回傳 JSON。", true);
      return `💪 [健身紀錄模式]\n已分析您的訓練內容：\n${jsonStr}`;
    } catch (e) {
      return "抱歉，無法解析您的健身紀錄。";
    }
  }
}

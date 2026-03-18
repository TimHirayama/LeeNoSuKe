import { WebhookEvent } from "@line/bot-sdk";
import { ServiceHandler } from "../types";
import { GeminiService } from "./gemini.service";

export class TodoService implements ServiceHandler {
  async handle(event: WebhookEvent, text: string): Promise<string> {
    const prompt = `請分析這條待辦事項：
提取 1. 任務名稱 (task) 2. 緊急程度 (urgency) [HIGH/MEDIUM/LOW] 3. 截止時間 (deadline) (如果有)
回傳JSON格式。
使用者訊息：${text}`;

    try {
      const jsonStr = await GeminiService.generate(prompt, "你是一個效率專家，幫忙整理待辦事項，嚴格回傳 JSON。", true);
      return `📝 [待辦清單模式]\n已將此任務加入清單：\n${jsonStr}`;
    } catch (e) {
      return "抱歉，無法解析待辦事項。";
    }
  }
}

export class ChatService implements ServiceHandler {
  async handle(event: WebhookEvent, text: string): Promise<string> {
    try {
      const reply = await GeminiService.generate(text, "你是一隻個性有點傲嬌的鸚鵡，但不失幽默。請回應使用者的閒聊。");
      return reply;
    } catch (e) {
      return "(鸚鵡正在睡覺，不想理你)";
    }
  }
}


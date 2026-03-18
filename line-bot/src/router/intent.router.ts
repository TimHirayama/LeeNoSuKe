import { WebhookEvent } from "@line/bot-sdk";
import { IntentType } from "../types";
import { GeminiService } from "../services/gemini.service";

export class IntentRouter {
  static async classify(text: string): Promise<IntentType> {
    const lowerText = text.toLowerCase();

    // 判斷是否為行事曆意圖
    if (/^(加入活動|刪除活動|event|行程|約|去)/.test(lowerText) || /(點|分).*?(在|到|去)/.test(lowerText)) {
      return IntentType.CALENDAR;
    }

    // 判斷是否為健身意圖
    if (/^(fit|健身|深蹲|硬舉|臥推|訓練|workout)/.test(lowerText)) {
      return IntentType.FITNESS;
    }

    // 判斷是否為待辦事項
    if (/^(todo|待辦|記得去|幫我買|清單|提醒我)/.test(lowerText)) {
      return IntentType.TODO;
    }

    // 找不到符合的關鍵字，退回一般閒聊
    return IntentType.CHAT;
  }
}

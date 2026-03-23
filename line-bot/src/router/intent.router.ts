import { IntentType } from "../core/types";

export class IntentRouter {
  static async classify(text: string): Promise<IntentType> {
    const lowerText = text.toLowerCase();

    // 只保留高度相關的指令作為對話入口
    if (/加入行程|新增行程|加行程/.test(lowerText)) {
      return IntentType.CALENDAR_ADD;
    }

    if (/修改行程|改行程/.test(lowerText)) {
      return IntentType.CALENDAR_UPDATE;
    }

    if (/刪除行程|刪行程|取消行程/.test(lowerText)) {
      return IntentType.CALENDAR_DELETE;
    }

    // 當沒命中特定指令時
    return IntentType.UNKNOWN;
  }
}

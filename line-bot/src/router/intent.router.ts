import { IntentType } from "../core/types";

export class IntentRouter {
  static async classify(text: string): Promise<IntentType> {
    const lowerText = text.toLowerCase();

    // 1. 安全授權與密碼相關指令
    if (/產生啟動碼|給個啟動碼|我要授權|授權碼/.test(lowerText) && lowerText.length < 15) {
      return IntentType.GENERATE_PASSCODE;
    }
    if (/啟動碼|授權碼/.test(lowerText) && /\d{4}/.test(lowerText)) {
      return IntentType.ACTIVATE_GROUP_OTP;
    }

    // 2. 口譯官功能相關指令
    if (/開始口譯|開始翻譯|啟動口譯/.test(lowerText)) {
      return IntentType.TRANSLATOR_START;
    }
    if (/通訳開始|翻訳開始|通訳して|翻訳して/.test(lowerText)) {
      return IntentType.TRANSLATOR_START_JP;
    }
    if (/停止口譯|結束口譯|停止翻譯/.test(lowerText)) {
      return IntentType.TRANSLATOR_STOP;
    }
    if (/通訳終了|翻訳終了|通訳やめて|翻訳やめて/.test(lowerText)) {
      return IntentType.TRANSLATOR_STOP_JP;
    }

    // 3. 原本的私人助理功能 (保留)
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
  
  // 工具：從一段字串中簡單抽出 4 位數字
  static extractPasscode(text: string): string | null {
    const match = text.match(/\d{4}/);
    return match ? match[0] : null;
  }
}

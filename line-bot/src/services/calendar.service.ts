import { IntentType } from "../core/types";
import { sessionManager } from "../core/session.manager";
import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";
import { GeminiService } from "./gemini.service";

export class CalendarService {
  private calendar: any;

  constructor() {
    try {
      // 決定要讀取的憑證路徑
      const renderPath = "/etc/secrets/google-key.json";
      const localPath = path.resolve(process.cwd(), "google-key.json"); 
      const localAltPath = path.resolve(process.cwd(), "line-bot", "google-key.json"); 

      let targetKeyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (!targetKeyFile || !fs.existsSync(targetKeyFile)) {
        if (fs.existsSync(renderPath)) targetKeyFile = renderPath;
        else if (fs.existsSync(localPath)) targetKeyFile = localPath;
        else if (fs.existsSync(localAltPath)) targetKeyFile = localAltPath;
      }

      // 載入 Service Account 金鑰並設定權限
      const auth = new google.auth.GoogleAuth({
        keyFile: targetKeyFile,
        scopes: ["https://www.googleapis.com/auth/calendar.events"],
      });
      this.calendar = google.calendar({ version: "v3", auth });
    } catch (e) {
      console.error("日曆授權初始化失敗:", e);
    }
  }

  async handle(userId: string, intent: IntentType, text: string): Promise<string> {
    const session = sessionManager.getSession(userId);
    const step = session?.step || "INITIAL";

    if (intent === IntentType.CALENDAR_ADD) {
      return this.handleAddFlow(userId, step, text, session?.context);
    }
    
    // Todo: 其他兩個意圖未實作（交給未來擴充）
    sessionManager.clearSession(userId);
    return "抱歉，修改與刪除行程功能仍在公版擴充規畫中！您可以先試試「@狸之助 加入行程」。";
  }

  private async handleAddFlow(userId: string, step: string, text: string, context: any = {}): Promise<string> {
    
    // ====== Step 1: 初始化，反問標題 ======
    if (step === "INITIAL") {
      sessionManager.createOrUpdateSession(userId, IntentType.CALENDAR_ADD, "WAITING_TITLE", {});
      return "好喔！想幫你加個行程，請問活動名稱是什麼？";
    }

    // ====== Step 2: 收集標題，反問時間 ======
    if (step === "WAITING_TITLE") {
      const title = text.trim();
      sessionManager.createOrUpdateSession(userId, IntentType.CALENDAR_ADD, "WAITING_TIME", { title });
      return `收到，行程名稱記下了：「${title}」。\n請問時間是幾點幾分呢？(例如：明天下午三點)`;
    }

    // ====== Step 3: 收集時間，呼叫 Gemini 與 Google Calendar ======
    if (step === "WAITING_TIME") {
      const timeStr = text.trim();
      const title = context.title;

      try {
        const now = new Date();
        const currentDateTimeStr = now.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
        
        const systemInstruction = "你是一個行程時間解析助手。請從使用者的描述中提取活動必定會發生的 start_time 與 end_time (必須回傳嚴格的 YYYY-MM-DDTHH:mm:00 格式，請根據當下時間推算。若未提到結束時間，預設開始後1小時)。請只用嚴格的 JSON 格式回傳，屬性名稱必為 start_time 及 end_time。若無從判斷時間，請回傳 null";
        const prompt = `現在基準時間是 ${currentDateTimeStr}。使用者輸入的模糊時間是：${timeStr}`;

        const jsonStr = await GeminiService.generate(prompt, systemInstruction, true);
        const timeData = JSON.parse(jsonStr);

        if (!timeData || !timeData.start_time) {
          // 不清除 session，讓他再嘗試輸入一次時間
          return `抱歉，我聽不懂「${timeStr}」代表什麼時間。麻煩再給我一次更明確的時間喔！`;
        }

        // 呼叫 Google Calendar
        const calendarEvent = {
          summary: title,
          start: { dateTime: timeData.start_time, timeZone: "Asia/Taipei" },
          end: { dateTime: timeData.end_time || timeData.start_time, timeZone: "Asia/Taipei" },
        };

        const calendarId = process.env.CALENDAR_ID || "primary";
        const response = await this.calendar.events.insert({
          calendarId: calendarId,
          resource: calendarEvent,
        });

        console.log(`[行事曆建立成功]: ${response.data.htmlLink}`);

        // ====== 完成階段：清除 Session ======
        sessionManager.clearSession(userId);
        return `🎉 行程已成功排入日曆！\n名稱：${title}\n時間：${timeData.start_time.replace("T", " ")}`;
        
      } catch (e) {
        console.error("行事曆新增發生錯誤：", e);
        sessionManager.clearSession(userId); // 發生嚴重的外在錯誤才放棄對話
        return "抱歉，在轉換時間或是寫入日曆時發生了預期外的錯誤，對話已重置。";
      }
    }

    sessionManager.clearSession(userId);
    return "發生不知名的狀態錯誤，對話重新開始。";
  }
}

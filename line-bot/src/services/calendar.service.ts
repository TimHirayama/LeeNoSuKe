import { WebhookEvent } from "@line/bot-sdk";
import { ServiceHandler } from "../types";
import { GeminiService } from "./gemini.service";
import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";

export class CalendarService implements ServiceHandler {
  private calendar: any;

  constructor() {
    try {
      // 決定要讀取的憑證路徑
      const renderPath = "/etc/secrets/google-key.json";
      const localPath = path.resolve(process.cwd(), "google-key.json"); // 若在 line-bot 目錄下執行
      const localAltPath = path.resolve(process.cwd(), "line-bot", "google-key.json"); // 若在專案根目錄執行

      let targetKeyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (!targetKeyFile || !fs.existsSync(targetKeyFile)) {
        if (fs.existsSync(renderPath)) {
          targetKeyFile = renderPath;
        } else if (fs.existsSync(localPath)) {
          targetKeyFile = localPath;
        } else if (fs.existsSync(localAltPath)) {
          targetKeyFile = localAltPath;
        }
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

  async handle(event: WebhookEvent, text: string): Promise<string> {
    const now = new Date();
    const currentDateTimeStr = now.toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
    });

    const systemInstruction =
      "你是一個行程解析助手。請從使用者的訊息中提取：1. activity_name (活動名稱，字串) 2. start_time (開始時間，必須是 YYYY-MM-DDTHH:mm:00 格式，根據當下時間推算) 3. end_time (結束時間，必須是 YYYY-MM-DDTHH:mm:00 格式。如果使用者沒有提到結束時間或持續多久，請預設為開始時間之後 1 小時) 4. location (地點，字串)。請以嚴格的 JSON 格式回傳，不要加上 markdown 標籤。如果訊息與行程無關，請回傳 null。";

    const prompt = `現在時間是 ${currentDateTimeStr}。請解析以下訊息：\n${text}`;

    try {
      // 等待 Gemini 解析結果
      const jsonStr = await GeminiService.generate(
        prompt,
        systemInstruction,
        true // 開啟 JSON Mode
      );
      
      const eventData = JSON.parse(jsonStr);

      // 如果 Gemini 判斷這不是一個有效行程
      if (!eventData || !eventData.activity_name || !eventData.start_time) {
         return "抱歉，我無法從這句話中辨識出有效的行程，請提供完整的時間與名稱。";
      }

      // 檢查是否成功初始化日曆 API
      if (!this.calendar) {
        return "系統的日曆 API 尚未設定完成，請聯絡管理員。";
      }

      // 準備 Google Calendar 的建立物件
      const calendarEvent = {
        summary: eventData.activity_name,
        location: eventData.location || "",
        start: {
          dateTime: eventData.start_time,
          timeZone: "Asia/Taipei",
        },
        end: {
          dateTime: eventData.end_time || eventData.start_time,
          timeZone: "Asia/Taipei",
        },
      };

      // 取得在 .env 設定的目標日曆 ID（預設為 primary）
      const calendarId = process.env.CALENDAR_ID || "primary";

      // 呼叫 Google API 將行程寫入日曆
      const response = await this.calendar.events.insert({
        calendarId: calendarId,
        resource: calendarEvent,
      });

      console.log(`[行事曆建立成功]: ${response.data.htmlLink}`);

      // 回覆成功訊息
      // 解析以便給出易讀的時間 (將 T 換成空白即可)
      const displayTime = eventData.start_time.replace("T", " ");
      const displayLocation = eventData.location ? ` @ ${eventData.location}` : "";
      return `📅 已成功排入日曆！\n${eventData.activity_name}\n${displayTime}${displayLocation}`;

    } catch (e) {
      console.error("行事曆新增失敗：", e);
      return "抱歉，寫入行事曆的過程中發生錯誤。";
    }
  }
}


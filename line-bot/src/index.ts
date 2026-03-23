import * as line from "@line/bot-sdk";
import express from "express";
import dotenv from "dotenv";
import { IntentRouter } from "./router/intent.router";
import { IntentType } from "./core/types";
import { CalendarService } from "./services/calendar.service";
import { sessionManager } from "./core/session.manager";
import { BotProfile } from "./core/bot.info";

dotenv.config();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

// 初始化 Bot 資訊與別名
BotProfile.init(client);

// 初始化各部門 Service
const calendarService = new CalendarService();

const app = express();

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.post(
  "/webhook",
  line.middleware(config),
  async (req: express.Request, res: express.Response) => {
    try {
      const events: line.WebhookEvent[] = req.body.events;

      // 盡快回傳 200 給 LINE，避免 Webhook Timeout 重複發送
      res.json({});

      // 背景處理訊息
      Promise.allSettled(
        events.map(async (event) => {
          if (event.type !== "message" || event.message.type !== "text") {
            return;
          }

          const userId = event.source.userId;
          if (!userId) return;

          const originalText = event.message.text;

          // 階段一：查詢使用者目前是否有正在進行中的對話
          const activeSession = sessionManager.getSession(userId);

          // 階段二：過濾干擾 (尋找有沒有提到機器的名字)
          const { isMentioned, cleanText } = BotProfile.extractMention(originalText);

          // 【公版核心邏輯】：如果沒有被點名，而且也沒有進行中的對話，直接不理會
          if (!isMentioned && !activeSession) {
            return;
          }

          let replyText = "";

          try {
            // 階段三：確定意圖
            // 如果早就有對話紀錄，就沿用原本意圖 (繞過 NLP 與指令判斷)
            let currentIntent = activeSession?.intent;
            
            // 如果沒有紀錄，就將「去除名字後的乾淨指令」丟給 Router 判斷
            if (!currentIntent) {
               currentIntent = await IntentRouter.classify(cleanText);
            }

            // 階段四：根據意圖，將工作派發給對應的狀態機 Handler
            switch (currentIntent) {
              case IntentType.CALENDAR_ADD:
              case IntentType.CALENDAR_UPDATE:
              case IntentType.CALENDAR_DELETE:
                 replyText = await calendarService.handle(userId, currentIntent, cleanText);
                 break;
                 
              case IntentType.UNKNOWN:
              default:
                 // 被點名但聽不懂要幹嘛（或者是群組閒聊，但我們現在把機器人限縮住了）
                 // 我們可以從自動抓到的名字中隨機提供提示
                 const botName = BotProfile.getNames()[0];
                 replyText = `我聽不懂你在說什麼，目前我只會處理「加入行程」喔！\n(請輸入：@${botName} 加入行程)`;
                 break;
            }
          } catch (e) {
            console.error("處理流程發生錯誤:", e);
            sessionManager.clearSession(userId); // 發生嚴重錯誤重置對話
            replyText = "系統發生了一點小錯誤，已經為您將對話重置，請稍後再試。";
          }

          // 階段五：回傳結果給使用者
          if (replyText) {
            await client.replyMessage({
              replyToken: event.replyToken,
              messages: [{ type: "text", text: replyText }],
            });
          }
        })
      );
    } catch (err) {
      console.error("Webhook Error:", err);
      if (!res.headersSent) res.status(500).end();
    }
  }
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`LINE Bot listening on port ${port}`);
});

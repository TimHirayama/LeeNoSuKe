import * as line from "@line/bot-sdk";
import express from "express";
import dotenv from "dotenv";
import { IntentRouter } from "./router/intent.router";
import { IntentType } from "./types";

// 引入各業務邏輯服務
import { CalendarService } from "./services/calendar.service";
import { FitnessService } from "./services/fitness.service";
import { TodoService, ChatService } from "./services/todo_chat.service";

dotenv.config();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

// 初始化各部門 Service
const calendarService = new CalendarService();
const fitnessService = new FitnessService();
const todoService = new TodoService();
const chatService = new ChatService();

const app = express();

// 加入 ping 路由供外部服務持續喚醒 Render
app.get("/ping", (req, res) => {
  res.send("pong");
});

app.post(
  "/webhook",
  line.middleware(config),
  async (req: express.Request, res: express.Response) => {
    try {
      const events: line.WebhookEvent[] = req.body.events;

      const results = await Promise.all(
        events.map(async (event) => {
          if (event.type !== "message" || event.message.type !== "text") {
            return null;
          }

          const userText = event.message.text;
          console.log(`[收到發言]: ${userText}`);

          let replyText = "";
          
          try {
            // 階段一：打給總機，判斷使用者的意圖
            const intent = await IntentRouter.classify(userText);
            console.log(`[總機分類結果]: ${intent}`);

            // 階段二：根據意圖，將工作派發給對應的部門
            switch (intent) {
              case IntentType.CALENDAR:
                replyText = await calendarService.handle(event, userText);
                break;
              case IntentType.FITNESS:
                replyText = await fitnessService.handle(event, userText);
                break;
              case IntentType.TODO:
                replyText = await todoService.handle(event, userText);
                break;
              case IntentType.CHAT:
              case IntentType.UNKNOWN:
              default:
                replyText = await chatService.handle(event, userText);
                break;
            }
          } catch (e) {
            console.error("處理流程發生錯誤:", e);
            replyText = "系統發生了一點小錯誤，請稍後再試。";
          }

          // 階段三：回傳結果給使用者
          return client.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: "text",
                text: replyText,
              },
            ],
          });
        }),
      );

      res.json(results);
    } catch (err) {
      console.error("Webhook Error:", err);
      res.status(500).end();
    }
  },
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`LINE Bot listening on port ${port}`);
});

import * as line from "@line/bot-sdk";
import express from "express";
import dotenv from "dotenv";
import { IntentRouter } from "./router/intent.router";
import { IntentType } from "./core/types";
import { CalendarService } from "./services/calendar.service";
import { TranslatorService } from "./services/translator.service";
import { sessionManager } from "./core/session.manager";
import { authManager } from "./core/auth.manager";
import { BotProfile } from "./core/bot.info";

dotenv.config();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

BotProfile.init(client);

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

      res.json({}); 

      Promise.allSettled(
        events.map(async (event) => {
          if (event.type !== "message" || event.message.type !== "text") {
            return;
          }

          const userId = event.source.userId;
          if (!userId) return;

          const isDirectMessage = event.source.type === "user";
          const groupId = event.source.type === "group" ? event.source.groupId : (event.source.type === "room" ? event.source.roomId : null);

          const originalText = event.message.text;

          // 階段一：過濾干擾 (尋找有沒有提到機器的名字)
          const { isMentioned, cleanText } = BotProfile.extractMention(originalText);

          let replyText = "";
          const groupSession = groupId ? sessionManager.getSession(groupId) : undefined;

          // ========== [情境 A: 群組口譯攔截模式] ==========
          // 如果該群組正在口譯狀態，攔截「所有」訊息翻譯 (除非是停止口譯的密語)
          if (groupSession?.intent === IntentType.TRANSLATING) {
            
            // 檢查是不是要「停止口譯」
            const quickIntent = await IntentRouter.classify(cleanText);
            if (isMentioned && quickIntent === IntentType.TRANSLATOR_STOP) {
              sessionManager.clearSession(groupId!);
              replyText = "🔇 口譯模式已結束。狸之助暫時告退！";
            } else {
              // 把所有文字送去翻譯
              replyText = await TranslatorService.translate(originalText);
            }
          }
          // ========== [情境 B: 正常服務分發模式] ==========
          else {
            // 防護：必須具備「被點名」、「私訊」或「個人對話進行中」才會理會
            const userSession = sessionManager.getSession(userId);
            if (!isDirectMessage && !isMentioned && !userSession) {
              return; 
            }

            // 判斷意圖
            let currentIntent = userSession?.intent;
            if (!currentIntent) {
               currentIntent = await IntentRouter.classify(cleanText);
            }

            switch (currentIntent) {
              
              // ---------------- 【私人助理指令 (主人才可用)】 ----------------
              case IntentType.CALENDAR_ADD:
              case IntentType.CALENDAR_UPDATE:
              case IntentType.CALENDAR_DELETE:
              case IntentType.GENERATE_PASSCODE:
                // 防火牆 1：檢查是否為 1 對 1 私訊
                if (!isDirectMessage) {
                  replyText = "⚠️ 這是私人助理指令，為了保護主人權益與隱私，我不可以在群組裡執行這個操作喔！";
                  break;
                }
                // 防火牆 2：檢查是否為主人
                if (!authManager.isAdmin(userId)) {
                  replyText = "⛔ 抱歉，你不是我的主人，不能使用私人助理的專屬功能。";
                  break;
                }

                if (currentIntent === IntentType.GENERATE_PASSCODE) {
                  const otp = authManager.generateOTP();
                  replyText = `🔑 產生了一組單次啟動碼：${otp}\n\n請在接下來的 10 分鐘內，至你想要授權的群組中輸入：\n「@${BotProfile.getNames()[0]} 啟動碼: ${otp}」`;
                } else {
                  // 交給原本的行事曆邏輯處理
                  replyText = await calendarService.handle(userId, currentIntent, cleanText);
                }
                break;

              // ---------------- 【群組功能指令 (需授權才可用)】 ----------------
              case IntentType.ACTIVATE_GROUP_OTP:
                if (isDirectMessage) {
                  replyText = "這是一對一私人聊天室，不需要啟動碼授權！直接下達主人指令吧。";
                  break;
                }
                const passcode = IntentRouter.extractPasscode(cleanText);
                if (!passcode) {
                   replyText = "請輸入明確的四位數啟動碼，例如：啟動碼: 8859";
                   break;
                }
                
                const isActivated = authManager.verifyOTP(passcode, groupId!);
                if (isActivated) {
                  replyText = "✅ 身分驗證成功！本群組已獲得主人授權，可以使用「即時口譯」等群組專屬功能。";
                } else {
                  replyText = "❌ 啟動碼錯誤或已過期作廢。";
                }
                break;

              case IntentType.TRANSLATOR_START:
                if (isDirectMessage) {
                  replyText = "我們現在只有兩個人，直接講話就好啦！(口譯官功能僅限群組使用)";
                  break;
                }
                if (!authManager.isGroupAuthorized(groupId!)) {
                  replyText = "⛔ 本群組尚未獲得授權，無法開啟口譯功能。\n請請主人私訊我取得「單次啟動碼」，並在這裡輸入。";
                  break;
                }
                // 開始為這個群組啟動無情口譯狀態
                sessionManager.createOrUpdateSession(groupId!, IntentType.TRANSLATING, "ACTIVE");
                const bName = BotProfile.getNames()[0];
                replyText = `🎙️ 即時口譯官上線！接下來這個群組出現的【每一句日文】我都會翻成中文，【每一句中文】都會翻成日文。\n需要我下班請隨時打字：「@${bName} 停止口譯」。`;
                break;

              case IntentType.TRANSLATOR_STOP:
                replyText = "雖然我現在沒有在口譯，但也隨時待命！";
                break;

              // ---------------- 【未知指令】 ----------------
              case IntentType.UNKNOWN:
              default:
                const botName = BotProfile.getNames()[0];
                if (isDirectMessage) {
                   replyText = "我聽不懂你在說什麼，目前我的私人助理功能只有「給個啟動碼」跟「加入行程」。";
                } else {
                   replyText = `我聽不懂你在說什麼，目前群組功能只有「開始口譯」喔！\n(請輸入：@${botName} 開始口譯)`;
                }
                break;
            }
          }

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

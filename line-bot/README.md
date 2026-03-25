# LeeNoSuKe 狸之助 LINE Bot

這是一個具備「主人私密助理」與「群組口譯官」雙重身份的進階公版 LINE Bot。

## 🌟 核心功能

1. **多輪對話排程管家** (私人助理限定)
   - 在 1對1 私訊可以直接輸入「加入行程」等指令，機器人會逐步引導並寫入 Google Calendar。
   
2. **即時雙向口譯官** (群組限定)
   - 具有安全考量，僅有「經過密碼授權」的群組可以使用。
   - 在群組中輸入 `@狸之助 開始口譯` 即可攔截所有中日對話進行即時翻譯。

## 🔒 環境變數設定

要讓這套公版順利運作，請確保 `.env` (或 Render Environment Variables) 包含以下變數：

```env
LINE_CHANNEL_ACCESS_TOKEN=你的LINE_TOKEN
LINE_CHANNEL_SECRET=你的LINE_SECRET
GEMINI_API_KEY=你的GEMINI_KEY
GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/google-key.json
CALENDAR_ID=你的Google日曆ID (預設為 primary)

# === 進階安全設定 ===
# 誰才是這個機器人的主人？(請填入你的 LINE User ID，長得像 U1234567890abcdef...)
ADMIN_USER_ID=你的LINE_USER_ID

# 機器人可識別的別名 (選填，使用逗號分隔)
BOT_ALIASES=小幫手,管家
```

## 🚀 群組授權使用指南 (一次性密碼 OTP)

為了避免陌生人亂加機器人消耗資源，群組功能預設為**鎖定狀態**。
1. **主人私訊**：對著機器人說「給個啟動碼」，系統會產生一組隨機的 4 位數密碼（例如 1234）。
2. **前往群組**：在欲授權的群組中輸入「@狸之助 啟動碼: 1234」。
3. **完成驗證**：機器人會記錄該群組為白名單，並且使密碼作廢。該群組即可開始使用口譯功能！

## 開發與部署

- 本地測試：`npm run dev`
- Render 部署設定：
  - Build Command：`npm install --production=false && npm run build`
  - Start Command：`npm start` (或 node dist/index.js)

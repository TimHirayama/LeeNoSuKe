# LINE 智能小幫手專案

這是一個使用 Node.js、TypeScript 與 `@line/bot-sdk` 開發的 LINE 聊天機器人。
本專案採用意圖導向路由架構，結合了 Google Gemini 的強大自然語言處理能力，能辨識多種不同的任務意圖。
主要功能不再只是單純的「回聲機器人」，而是可以作為個人智能小幫手使用：

*   📅 **行事曆小幫手**: 透過自然語言解析活動內容與時間，自動將行程排入 Google Calendar。
*   💪 **健身紀錄助手**: 解析健身紀錄並整理部位、動作名稱、重量與組數。
*   📝 **待辦事項管理**: 協助整理與提取待辦事項及緊急程度。
*   🦜 **傲嬌鸚鵡聊天**: 提供幽默的日常陪伴與閒聊。

## 🚀 如何在本地端啟動開發環境

要在本地端啟動這個機器人，你需要**同時開啟兩個終端機視窗**。

### 步驟 0：設定環境變數
請在專案根目錄下建立一個 `.env` 檔案，並填入以下資訊：

```env
LINE_CHANNEL_ACCESS_TOKEN=你的_LINE_CHANNEL_ACCESS_TOKEN
LINE_CHANNEL_SECRET=你的_LINE_CHANNEL_SECRET

GEMINI_API_KEY=你的_GEMINI_API_KEY
GEMINI_MODEL=gemini-flash-latest # 或其他支援的 Gemini 模型 (選填，預設為 gemini-flash-latest)

GOOGLE_APPLICATION_CREDENTIALS=你的_GCP_Service_Account_Key.json_路徑
CALENDAR_ID=你的_Google_Calendar_ID # (選填，預設為 primary)
```
**注意：`.env` 及 GCP Service Account Key 檔案絕對不可以上傳到公開的 GitHub 上。**

### 步驟 1：啟動本地伺服器
請開啟第一個終端機視窗，進入專案資料夾並啟動開發伺服器：

```bash
cd line-bot
npm install   # (有安裝過新套件才需要跑)
npm run dev
```
啟動成功後，終端機會顯示 `LINE Bot listening on port 3000`。
*這個指令使用了 `ts-node-dev`，所以你只要修改 `src/index.ts` 存檔後，伺服器就會自動重啟，不需手動開關！*

---

### 步驟 2：啟動 ngrok 建立外部連結
請開啟**第二個**終端機視窗（不要關掉第一個），啟動 ngrok 將本地的 3000 port 對外暴露：

```bash
ngrok http 3000
```
啟動後，請找尋畫面上的 `Forwarding` 欄位，它會顯示一串以 `.ngrok-free.dev` 或 `.ngrok-free.app` 結尾的 HTTPS 網址。
*(注意：因為你使用的是免費帳號且配有 static domain，如果你沒有指定 `--domain` 參數，它通常會預設分配給你的靜態網域)*

---

### 步驟 3：設定 LINE Webhook URL (如果有更換 ngrok 網址的話)
1. 進入 [LINE Developers Console](https://developers.line.biz/console/)。
2. 找到你的 Messaging API 設定頁面。
3. 在 **Webhook URL** 欄位填入：
   `https://[你的 ngrok 網址]/webhook`
   *(⚠️ 務必要加上 `/webhook` 結尾！)*
4. 點擊 **Update** 後，按一下 **Verify** 確保連線正常。

### 步驟 4：開始對話
打開你的 LINE，傳送訊息給你的機器人測試吧！

## 📂 專案結構說明
*   `src/index.ts`: 系統接收與驗證層，接收 LINE 訊息並轉交給路由層處理。
*   `src/router/`: 路由與意圖分類層 (Intent Router)，扮演「大腦總機」，將自然語言傳送給 Gemini 解析意圖。
*   `src/services/`: 業務邏輯服務層，每個功能擁有獨立的 Service 檔案 (如 `calendar.service.ts`, `fitness.service.ts` 等)。
*   `src/types/`: TypeScript 型別定義。
*   `.env`: 存放環境變數（金鑰及憑證路徑）。
*   `package.json` / `tsconfig.json`: Node.js 與 TypeScript 的設定檔。
*   `ARCHITECTURE.md`: 系統架構設計詳細說明。

## 🛑 疑難排解
*   **機器人已讀不回 / 沒反應**：確認兩個終端機（`npm run dev` 跟 `ngrok`）都有乖乖在跑。
*   **Webhook Verify 失敗**：確認 `.env` 裡的金鑰有沒有填錯，以及 Webhook URL 結尾是不是正確的 `/webhook`。
*   **行事曆授權失敗或無法寫入**：確認 `GOOGLE_APPLICATION_CREDENTIALS` 的路徑是否正確，並且 Service Account 已獲取該日曆的編輯權限。

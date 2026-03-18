# LINE 鸚鵡機器人專案

這是一個使用 Node.js、TypeScript 與 `@line/bot-sdk` 開發的 LINE 聊天機器人。
主要功能為「回聲機器人 (Echo Bot)」，會將使用者傳送的文字訊息加料後回傳。

## 🚀 如何在本地端啟動開發環境

要在本地端啟動這個機器人，你需要**同時開啟兩個終端機視窗**。

### 步驟 1：啟動本地伺服器
請開啟第一個終端機視窗，進入專案資料夾並啟動開發伺服器：

```bash
cd /Users/tim.chen/Desktop/LeeNoSuKe/line-bot
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
*(注意：因為你使用的是免費帳號且配有 static domain，如果你沒有指定 `--domain` 參數，它通常會預設分配 `pseudospherical-goldie-uniridescently.ngrok-free.dev` 給你)*

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
*   `src/index.ts`: 機器人的核心邏輯都在這裡。
*   `.env`: 存放你的 `LINE_CHANNEL_SECRET` 與 `LINE_CHANNEL_ACCESS_TOKEN`，這個檔案**絕對不可以**上傳到公開的 GitHub 上。
*   `package.json` / `tsconfig.json`: Node.js 與 TypeScript 的設定檔。

## 🛑 疑難排解
*   **機器人已讀不回 / 沒反應**：確認兩個終端機（`npm run dev` 跟 `ngrok`）都有乖乖在跑。
*   **Webhook Verify 失敗**：確認 `.env` 裡的金鑰有沒有填錯，以及 Webhook URL 結尾是不是正確的 `/webhook`。

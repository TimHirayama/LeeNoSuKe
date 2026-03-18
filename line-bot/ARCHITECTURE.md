# 系統架構設計

## 意圖導向路由架構 (Intent-Based Routing Architecture)

為了讓 LINE Bot 能夠處理多種不同的任務（例如：行事曆、待辦事項、健身紀錄等），且保持程式碼整潔與高擴展性，本專案採用三層式的意圖導向路由架構。

### 1. 接收與驗證層 (Webhook Layer / `src/index.ts`)
- 負責啟動 Express 伺服器並監聽 `/webhook`。
- 使用 LINE SDK 的 middleware 驗證請求來源。
- 解析出純文字訊息，轉交給路由層處理。
- 將最終結果封裝回 LINE 的回覆格式 (`replyMessage`) 並送出。

### 2. 路由與意圖分類層 (Intent Router / `src/router/intent.router.ts`)
- 扮演「大腦總機」的角色。
- 將使用者的自然語言訊息傳送給 Gemini 模型（輕量解析）。
- Gemini 解析後，回傳標準化的**意圖代碼 (Intent Code)**，例如：
  - `CALENDAR`: 行事曆相關
  - `FITNESS`: 健身紀錄相關
  - `TODO`: 待辦事項相關
  - `CHAT`: 閒聊或無法分類
- 根據回傳的代碼，將原始訊息轉發給對應的 Service 單元。

### 3. 業務邏輯服務層 (Service Layer / `src/services/*`)
每個功能擁有獨立的 Service 檔案，負責處理專屬的邏輯與呼叫外部 API。
- **`gemini.service.ts`**: 封裝與 Google Generative AI 的連線邏輯，提供共用的呼叫介面。
- **`calendar.service.ts`**: 第二次呼叫 Gemini，提取精確的起始時間、結束時間（ISO 8601）與地點，並輸出 JSON（未來用於串接 Google Calendar API）。
- **`fitness.service.ts`**: (規劃中) 分析運動項目、重量、組數。
- **`todo.service.ts`**: (規劃中) 分析待辦事項標題與期限。
- **`chat.service.ts`**: (規劃中) 提供純粹的對話陪伴邏輯。

### 架構優勢
- **關注點分離 (Separation of Concerns)**: 新增功能時，只需增加一個 Intent Enum 和對應的 Service，不需修改核心路由。
- **成本與效能優化**: 總機（Router）只需做簡單的情境分類，只有當確認是複雜任務（如存入行事曆）時，才進一步呼叫耗時的深入解析邏輯。

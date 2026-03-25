# LINE Bot 商用公版 (SaaS Boilerplate) 設定與操作說明書

為了方便未來量產與接案，此專案已被高度抽離與模組化。當你接獲新案子（例如：幫某牙醫診所、企業老闆製作專屬 AI 特助）時，請依照此說明書進行「無程式碼 (Zero-Code)」的快速客製化與部署。

---

## 第一步：環境變數設定 (.env)

請複製專案根目錄的 `.env.example` 並重新命名為 `.env`。
填寫以下重要核心欄位：

```env
# 1. LINE Channel 設定 (至 LINE Developers Console 獲取)
LINE_CHANNEL_ACCESS_TOKEN="填寫客戶專屬的 Token"
LINE_CHANNEL_SECRET="填寫客戶專屬的 Secret"

# 2. 各項 API 金鑰
GEMINI_API_KEY="填寫 Google AI Studio 的 Gemini 金鑰"
GOOGLE_APPLICATION_CREDENTIALS="/etc/secrets/google-key.json" # 若有使用行事曆的憑證路徑

# 3. 身分權限 (安全性考量，務必填寫業主本人的真實 LINE User ID)
ADMIN_USER_ID="U1234567890abcdef..."
```

---

## 第二步：神速客製化「AI 機器人人設」

為了讓你接案交件更神速，你不需要動到任何 TypeScript 邏輯！
幾乎所有的語氣、設定與知識庫都在 `src/prompts/` 與 `src/docs/` 底下。

### 1. 修改機器人對外名稱與自稱 (在 `.env` 中)
```env
BOT_ALIASES="小幫手,牙醫特助" 
BOT_PERSONA="溫柔護理師"
```

### 2. 修改各情境下 AI 的系統提示詞 (System Prompts)
打開 `src/prompts/` 資料夾，直接用記事本編輯裡面的 `.txt` 檔：
* **`tutor_persona.txt`**：面對主人 (ADMIN) 私訊時的服侍態度（原定為主人的日文家教）。
* **`translator_rules.txt`**：口譯官專用的嚴格翻譯守則（如非需要轉換語種，通常不需要動）。
* **`spokesperson_rules.txt`**：面對路人、顧客私訊時的對外發言人態度（預設為傲嬌，可依照客戶需求改為「專業客服人員」或「活潑小編」）。

### 3. 更新主人的「公開知識庫 (RAG 系統)」
當陌生顧客向官方帳號提問時，AI 發言人會根據 **`src/docs/about_me.md`** 的內容來解答。
👉 請把新客戶的營業時間、常見 QA (FAQ)、履歷與報價單通通寫進 `about_me.md` 裡（你可以當成在寫 Wiki 一樣隨便建構文字）。機器人會自動把它讀進大腦中為顧客解惑。

---

## 第三步：模組開關 (因應客戶的 Feature Flags 收費策略)

你能針對不同客戶的付費方案，在 `.env` 進行功能閹割與開啟：

```env
FEATURE_PRIVATE_ASSISTANT=true    # 開啟「行事曆與個人特助功能」(高階：老闆私用)
FEATURE_SPOKESPERSON=true         # 開啟「RAG 代理發言人功能」(基礎：企業客服代答)
FEATURE_TRANSLATOR=true           # 開啟「群組即時口譯官」(高階：跨國群組支援)
```
只要你將未購買的服務設為 `false`，未購買該功能的用戶試圖下指令時，系統就會合法攔截並拒絕處理。

---

## 第四步：群組功能開通 (安全單次啟動碼 OTP 機制)

為了保護 Gemini 額度不被陌生群組濫加濫用，群組功能（如口譯）預設是**「鎖死」**的。

**如何幫特定的商務群組開通授權？**
1. **產生啟動碼**：請「身為老闆的客戶」私訊他自家的官方帳號，輸入：`給個啟動碼`。
2. **獲取密碼**：機器人會回覆產生一組 4 位數密碼（例如：`1234`）。
3. **授權群組**：請該客戶到想授權的群組中，輸入：`@機器人名字 啟動碼: 1234`
4. **驗證完成**：這組密碼驗證後立刻作廢、不可重用。而該群組正式擁有進階功能呼叫的權限！

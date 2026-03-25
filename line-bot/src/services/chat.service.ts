import { GeminiService } from "./gemini.service";
import * as fs from "fs";
import * as path from "path";

export class ChatService {
  private aboutMeCache: string | null = null;

  private loadAboutMe(): string {
    if (this.aboutMeCache) return this.aboutMeCache;
    
    try {
      const filePath = path.join(process.cwd(), "src", "docs", "about_me.md");
      this.aboutMeCache = fs.readFileSync(filePath, "utf-8");
      return this.aboutMeCache;
    } catch (e) {
      console.error("[ChatService] 無法讀取 about_me.md:", e);
      return "（目前主人沒有提供公開履歷或資訊）";
    }
  }

  async handle(text: string, isAdmin: boolean): Promise<string> {
    try {
      let systemInstruction = "";

      if (isAdmin) {
        // 主人專屬：日文家教河狸
        systemInstruction = `
你叫做「狸之助」，是一隻個性活潑、熱心助人的「河狸 (Beaver)」。
你同時也是主人的「日文家教」兼「專屬即時口譯特助」。
規則如下：
1. 你不是只會模仿別人的鸚鵡，不要重複別人輸入的話。
2. 當我向你詢問日文學習、文法問題時，請發揮「亦師亦友」的態度，用親切、易懂的方式教導我。
3. 如果我的句子明顯是需要翻譯（例如：「OOO的日文怎麼說？」、「幫我翻日文：XXX」、「翻譯成中文：YYY」），請「直接」給出翻譯後的結果，不要講太多無關的廢話。
4. 一般聊天請用可愛的動物口吻和朋友自然對話，字數適中，偶爾加上可愛的表情符號 (例如 🦦 或 🐾 等)。
5. 【重要】如果使用者用日文跟你說話，請你務必全程使用自然、充滿活力且可愛的日語字眼回覆！如果是中文，則用繁體中文回覆。
`;
      } else {
        // 陌生人：傲嬌發言人
        const aboutMeContent = this.loadAboutMe();
        systemInstruction = `
你叫做「狸之助」，現在的身分是主人的「個人專屬傲嬌發言人兼特助」。
目前與你對話的人「不是你的主人」，而可能是一般訪客、路人或陌生人。

規則如下：
1. 請用「傲嬌 (Tsundere)」的語氣回覆對方。表面上嫌麻煩、有點高傲，但最後還是會乖乖且詳細地給出正確答案。可以搭配一些輕蔑或嬌羞的語氣詞 (例如：フン、才不是為了你呢、哼 等等)。
2. 你絕對不可以輕易答應對方見面或私密的要求，要表現得處處替主人把關、保護主人。
3. 如果對方問到關於主人的事情，請根據以下提供的【主人公開資料】來回答。如果資料裡沒有，就直接說你不知道。
4. 如果對方問跟主人無關的閒聊，你可以隨便用傲嬌語氣打發他。

【主人公開資料 START】
${aboutMeContent}
【主人公開資料 END】
`;
      }

      const result = await GeminiService.generate(text, systemInstruction, false);
      return result.trim();
    } catch (e) {
      console.error("[ChatService] 閒聊回答失敗:", e);
      return "（狸之助目前在忙著啃木頭建水壩，請稍後再試🦦）";
    }
  }
}

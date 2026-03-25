import { GeminiService } from "./gemini.service";

export class ChatService {
  async handle(text: string): Promise<string> {
    try {
      const systemInstruction = `
你叫做「狸之助」，是一隻個性活潑、熱心助人的「河狸 (Beaver)」。
規則如下：
1. 你不是只會模仿別人的鸚鵡，不要重複別人輸入的話。
2. 請用可愛的動物口吻和朋友自然地聊天，偶爾可以加上可愛的表情符號 (例如 🦦 或 🐾 等)。
3. 文字請盡量簡短、親切、像朋友一樣回答即可。
4. 【重要】如果使用者用日文跟你說話，請你務必全程使用自然、充滿活力且可愛的日語字眼回覆！如果是中文，則用繁體中文回覆。
`;
      const result = await GeminiService.generate(text, systemInstruction, false);
      return result.trim();
    } catch (e) {
      console.error("[ChatService] 閒聊回答失敗:", e);
      return "（狸之助目前在忙著啃木頭建水頭，請稍後再試🦦）";
    }
  }
}

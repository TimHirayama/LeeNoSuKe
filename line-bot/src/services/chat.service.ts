import { GeminiService } from "./gemini.service";
import * as fs from "fs";
import * as path from "path";
import { config } from "../config";
import { BotProfile } from "../core/bot.info";

export class ChatService {
  private aboutMeCache: string | null = null;
  private tutorCache: string | null = null;
  private spokespersonCache: string | null = null;

  private readFileSafely(relativePath: string): string {
    try {
      const filePath = path.join(process.cwd(), relativePath);
      return fs.readFileSync(filePath, "utf-8");
    } catch (e) {
      console.error(`[ChatService] 無法讀取檔案 ${relativePath}:`, e);
      return "";
    }
  }

  private loadAboutMe(): string {
    if (this.aboutMeCache) return this.aboutMeCache;
    this.aboutMeCache = this.readFileSafely("src/docs/about_me.md") || "（主人尚未提供公開履歷）";
    return this.aboutMeCache;
  }

  private loadTutorPrompt(): string {
    if (this.tutorCache) return this.tutorCache;
    this.tutorCache = this.readFileSafely("src/prompts/tutor_persona.txt");
    return this.tutorCache;
  }

  private loadSpokespersonPrompt(): string {
    if (this.spokespersonCache) return this.spokespersonCache;
    this.spokespersonCache = this.readFileSafely("src/prompts/spokesperson_rules.txt");
    return this.spokespersonCache;
  }

  async handle(text: string, isAdmin: boolean): Promise<string> {
    try {
      let systemInstruction = "";
      const botName = BotProfile.getNames()[0] || "狸之助";
      const botPersona = config.bot.persona;

      if (isAdmin) {
        // 主人專屬：日文家教河狸 (載入外部 Prompt)
        let template = this.loadTutorPrompt();
        if (!template) {
           return "（發生錯誤：遺失 tutor_persona.txt）";
        }
        systemInstruction = template
            .replace(/\{\{BOT_NAME\}\}/g, botName)
            .replace(/\{\{BOT_PERSONA\}\}/g, botPersona);
      } else {
        // 陌生人：傲嬌發言人 (載入外部 Prompt 與 AboutMe)
        const aboutMeContent = this.loadAboutMe();
        let template = this.loadSpokespersonPrompt();
        if (!template) {
           return "（發生錯誤：遺失 spokesperson_rules.txt）";
        }
        systemInstruction = template
            .replace(/\{\{BOT_NAME\}\}/g, botName)
            .replace(/\{\{ABOUT_ME\}\}/g, aboutMeContent);
      }

      const result = await GeminiService.generate(text, systemInstruction, false);
      return result.trim();
    } catch (e) {
      console.error("[ChatService] 閒聊回答失敗:", e);
      return `（${config.bot.persona} 目前在忙著處理事情，請稍後再試）`;
    }
  }
}

import * as line from "@line/bot-sdk";

export class BotProfile {
  private static displayName: string = "Bot"; 
  private static aliases: string[] = [];

  static async init(client: line.messagingApi.MessagingApiClient) {
    try {
      const info = await client.getBotInfo();
      this.displayName = info.displayName;
      console.log(`[Bot Info] Successfully fetched bot name: ${this.displayName}`);
    } catch (e) {
      console.error(`[Bot Info] Failed to fetch bot name, using default.`, e);
    }

    if (process.env.BOT_ALIASES) {
      this.aliases = process.env.BOT_ALIASES.split(",").map(a => a.trim());
    }
  }

  static getNames(): string[] {
    return [this.displayName, ...this.aliases];
  }

  static extractMention(text: string): { isMentioned: boolean; cleanText: string } {
    const names = this.getNames();
    let isMentioned = false;
    let cleanText = text;

    for (const name of names) {
      const regex = new RegExp(`@?${name}`, 'i');
      if (regex.test(cleanText)) {
        isMentioned = true;
        cleanText = cleanText.replace(regex, "").trim();
      }
    }

    return { isMentioned, cleanText };
  }
}

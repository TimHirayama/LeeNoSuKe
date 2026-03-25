import dotenv from "dotenv";
dotenv.config();

export const config = {
  line: {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
    channelSecret: process.env.LINE_CHANNEL_SECRET || "",
  },
  server: {
    port: process.env.PORT || 3000,
  },
  bot: {
    adminUserId: process.env.ADMIN_USER_ID,
    // 以逗號分隔的別名，預設為[狸之助, 小幫手]
    names: (process.env.BOT_ALIASES || "狸之助,小幫手").split(",").map(name => name.trim()),
    // 讓客戶自由設定，例如 黑貓、AI管家等
    persona: process.env.BOT_PERSONA || "河狸", 
  },
  features: {
    // 功能開關：預設全開，除非客戶在 .env 裡明確定為 'false'
    enablePrivateAssistant: process.env.FEATURE_PRIVATE_ASSISTANT !== "false", 
    enableSpokesperson: process.env.FEATURE_SPOKESPERSON !== "false",       
    enableTranslator: process.env.FEATURE_TRANSLATOR !== "false",           
  }
};

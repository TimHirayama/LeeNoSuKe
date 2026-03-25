export enum IntentType {
  // === 私人助理指令 (Private) ===
  CALENDAR_ADD = "CALENDAR_ADD",
  CALENDAR_UPDATE = "CALENDAR_UPDATE",
  CALENDAR_DELETE = "CALENDAR_DELETE",
  GENERATE_PASSCODE = "GENERATE_PASSCODE",
  
  // === 群組授權指令 (Group) ===
  ACTIVATE_GROUP_OTP = "ACTIVATE_GROUP_OTP",
  TRANSLATOR_START = "TRANSLATOR_START",
  TRANSLATOR_START_JP = "TRANSLATOR_START_JP",
  TRANSLATOR_STOP = "TRANSLATOR_STOP",
  TRANSLATOR_STOP_JP = "TRANSLATOR_STOP_JP",
  
  // === 翻譯中狀態 (Intercept) ===
  TRANSLATING = "TRANSLATING",

  UNKNOWN = "UNKNOWN",
}

export interface SessionContext {
  [key: string]: any;
}

export interface UserSession {
  userId: string;
  intent: IntentType;
  step: string;
  context: SessionContext;
  updatedAt: number;
}

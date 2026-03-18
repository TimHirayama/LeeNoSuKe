import { WebhookEvent } from "@line/bot-sdk";

export enum IntentType {
  CALENDAR = "CALENDAR",
  FITNESS = "FITNESS",
  TODO = "TODO",
  CHAT = "CHAT",
  UNKNOWN = "UNKNOWN",
}

export interface IntentResponse {
  intent: IntentType;
  confidence: number;
}

export interface ServiceHandler {
  handle(event: WebhookEvent, text: string): Promise<string | null>;
}

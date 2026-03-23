export enum IntentType {
  CALENDAR_ADD = "CALENDAR_ADD",
  CALENDAR_UPDATE = "CALENDAR_UPDATE",
  CALENDAR_DELETE = "CALENDAR_DELETE",
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

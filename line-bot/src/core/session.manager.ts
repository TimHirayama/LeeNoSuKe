import { UserSession, IntentType } from "./types";

export class SessionManager {
  private sessions = new Map<string, UserSession>();
  private readonly TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes timeout

  getSession(userId: string): UserSession | undefined {
    const session = this.sessions.get(userId);
    if (!session) return undefined;

    if (Date.now() - session.updatedAt > this.TIMEOUT_MS) {
      this.clearSession(userId);
      return undefined;
    }
    return session;
  }

  createOrUpdateSession(userId: string, intent: IntentType, step: string, context: any = {}): UserSession {
    const existing = this.sessions.get(userId);
    const session: UserSession = {
      userId,
      intent,
      step,
      context: existing ? { ...existing.context, ...context } : context,
      updatedAt: Date.now(),
    };
    this.sessions.set(userId, session);
    return session;
  }

  clearSession(userId: string) {
    this.sessions.delete(userId);
  }
}

export const sessionManager = new SessionManager();

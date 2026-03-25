export class AuthManager {
  private activeOTP: string | null = null;
  private authorizedGroups = new Set<string>();
  private otpCreatedAt: number = 0;
  private readonly OTP_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes timeout

  // 從環境變數抓取主人 ID
  get ADMIN_USER_ID(): string | undefined {
    return process.env.ADMIN_USER_ID;
  }

  isAdmin(userId: string): boolean {
    if (!this.ADMIN_USER_ID) {
      console.warn("警報：.env 尚未設定 ADMIN_USER_ID，全部人皆視為無權限！");
      return false;
    }
    return userId === this.ADMIN_USER_ID;
  }

  isGroupAuthorized(groupId: string): boolean {
    return this.authorizedGroups.has(groupId);
  }

  generateOTP(): string {
    // 產生隨機 4 位數密碼
    this.activeOTP = Math.floor(1000 + Math.random() * 9000).toString();
    this.otpCreatedAt = Date.now();
    return this.activeOTP;
  }

  verifyOTP(passcode: string, groupId: string): boolean {
    if (!this.activeOTP) return false;

    // 檢查密碼是否過期
    if (Date.now() - this.otpCreatedAt > this.OTP_TIMEOUT_MS) {
      this.activeOTP = null;
      return false;
    }

    if (passcode.trim() === this.activeOTP) {
      this.authorizedGroups.add(groupId);
      this.activeOTP = null; // 用過即作廢 OTP
      return true;
    }

    return false;
  }
}

export const authManager = new AuthManager();

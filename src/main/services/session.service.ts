import { TokenStorage } from "../storage/token.storage.js";

export class SessionService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(private readonly tokenStorage: TokenStorage) {}

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    await this.tokenStorage.save(refreshToken);
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  async restore(): Promise<boolean> {
    const refreshToken = await this.tokenStorage.load();

    if (!refreshToken) {
      return false;
    }

    this.refreshToken = refreshToken;

    return true;
  }

  async clear(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;

    await this.tokenStorage.clear();
  }

  hasAccessToken(): boolean {
    return this.accessToken !== null;
  }

  hasRefreshToken(): boolean {
    return this.refreshToken !== null;
  }
}

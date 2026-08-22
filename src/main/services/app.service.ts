import { AuthenticatedUser } from "../../commom/interface/authenticated-user.interface.js";
import { AuthService } from "./auth.service.js";
import { SessionService } from "./session.service.js";

export class AppService {
  private authenticatedUser: AuthenticatedUser | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService
  ) {}

  async initialize(): Promise<AuthenticatedUser | null> {
    const restored = await this.sessionService.restore();

    if (!restored) {
      return null;
    }

    const refreshed = await this.authService.refresh();

    if (!refreshed) {
      await this.sessionService.clear();

      return null;
    }

    try {
      const user = await this.authService.me();

      this.authenticatedUser = user;

      return user;
    } catch {
      await this.sessionService.clear();

      return null;
    }
  }

  setAuthenticatedUser(user: AuthenticatedUser): void {
    this.authenticatedUser = user;
  }

  getAuthenticatedUser(): AuthenticatedUser | null {
    return this.authenticatedUser;
  }

  async logout(): Promise<void> {
    this.authenticatedUser = null;

    await this.sessionService.clear();
  }
}

import { SessionService } from "./session.service.js";

const API_URL = "http://localhost:3000/api";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  role: string;
}

export class AuthService {
  constructor(private readonly sessionService: SessionService) {}

  async login(email: string, password: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      throw new Error("Não foi possível realizar o login.");
    }

    const data = (await response.json()) as LoginResponse;

    await this.sessionService.setTokens(data.accessToken, data.refreshToken);
  }

  async me(): Promise<AuthenticatedUser> {
    const accessToken = this.sessionService.getAccessToken();

    if (!accessToken) {
      throw new Error("Usuário não autenticado.");
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Não foi possível obter o usuário autenticado.");
    }

    return response.json() as Promise<AuthenticatedUser>;
  }

  async refresh(): Promise<boolean> {
    const refreshToken = this.sessionService.getRefreshToken();

    if (!refreshToken) {
      return false;
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    if (!response.ok) {
      await this.sessionService.clear();

      return false;
    }

    const data = (await response.json()) as LoginResponse;

    await this.sessionService.setTokens(data.accessToken, data.refreshToken);

    return true;
  }
}

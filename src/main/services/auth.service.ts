import "dotenv/config";

import { SessionService } from "./session.service.js";
import { AuthenticatedUser } from "../../commom/interface/authenticated-user.interface.js";
import { LoginResponse } from "../interface/login-response.interface.js";

const API_URL = process.env.API_URL;

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

  async verifyEmail(data: { email: string; code: string }): Promise<void> {
    const response = await fetch(`${API_URL}/auth/verify-email`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Não foi possível verificar o e-mail.");
    }
  }

  async resendVerificationEmail(data: { email: string }): Promise<void> {
    const response = await fetch(`${API_URL}/auth/resend-verification`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Não foi possível reenviar o código de verificação.");
    }
  }
}

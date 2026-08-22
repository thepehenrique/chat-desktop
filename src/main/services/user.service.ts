import "dotenv/config";
import { SessionService } from "./session.service.js";

interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

export class UserService {
  constructor(private readonly sessionService: SessionService) {}

  async findAll(): Promise<unknown[]> {
    const accessToken = this.sessionService.getAccessToken();

    if (!accessToken) {
      throw new Error("Não autenticado.");
    }

    const response = await fetch(`${process.env.API_URL}/users`, {
      method: "GET",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar usuários.");
    }

    return response.json();
  }

  async create(data: CreateUserRequest): Promise<number> {
    const response = await fetch(`${process.env.API_URL}/users`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();

      throw new Error(error || "Erro ao cadastrar usuário.");
    }

    return response.json();
  }
}

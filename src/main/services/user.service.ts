import { SessionService } from "./session.service.js";

const API_URL = "http://localhost:3000/api";

export interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

export class UserService {
  constructor(private readonly sessionService: SessionService) {}

  async findAll(): Promise<User[]> {
    const accessToken = this.sessionService.getAccessToken();

    if (!accessToken) {
      throw new Error("Usuário não autenticado.");
    }

    const response = await fetch(`${API_URL}/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Não foi possível carregar os usuários.");
    }

    return response.json() as Promise<User[]>;
  }
}

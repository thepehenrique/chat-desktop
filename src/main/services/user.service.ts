import "dotenv/config";
import { User } from "../interface/user.interface.js";
import { SessionService } from "./session.service.js";

export class UserService {
  constructor(private readonly sessionService: SessionService) {}

  async findAll(): Promise<User[]> {
    const accessToken = this.sessionService.getAccessToken();

    if (!accessToken) {
      throw new Error("Usuário não autenticado.");
    }

    const response = await fetch(`${process.env.API_URL}/users`, {
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

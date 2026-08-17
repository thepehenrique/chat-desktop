import { io, Socket } from "socket.io-client";
import { SessionService } from "./session.service.js";
import { BrowserWindow } from "electron";

const SOCKET_URL = "http://localhost:3000";

export class SocketService {
  private socket: Socket | null = null;

  constructor(private readonly sessionService: SessionService) {}

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const accessToken = this.sessionService.getAccessToken();

    if (!accessToken) {
      throw new Error("Não é possível conectar ao Socket.IO sem accessToken.");
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token: accessToken,
      },
    });

    this.registerConnectionEvents();
    this.registerPresenceEvents();
  }
  private registerConnectionEvents(): void {
    if (!this.socket) {
      return;
    }

    this.socket.on("connect", () => {
      console.log("Socket.IO conectado:", this.socket?.id);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Erro na conexão Socket.IO:", error.message);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket.IO desconectado:", reason);
    });
  }

  private registerPresenceEvents(): void {
    if (!this.socket) {
      return;
    }

    this.socket.on("online_users", (data: { userIds: number[] }) => {
      console.log("[SocketService] online_users:", data);

      this.emitToRenderer("socket:online-users", data);
    });

    this.socket.on("user_online", (data: { userId: number }) => {
      this.emitToRenderer("socket:user-online", data);
    });

    this.socket.on("user_offline", (data: { userId: number }) => {
      this.emitToRenderer("socket:user-offline", data);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  private emitToRenderer(channel: string, payload: unknown): void {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(channel, payload);
    }
  }
}

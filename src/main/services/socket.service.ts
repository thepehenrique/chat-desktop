import "dotenv/config";
import { io, Socket } from "socket.io-client";
import { SessionService } from "./session.service.js";
import { BrowserWindow } from "electron";

export class SocketService {
  private socket: Socket | null = null;

  constructor(private readonly sessionService: SessionService) {}

  connect(): void {
    console.log("[SocketService] connect() chamado");

    if (this.socket?.connected) {
      console.log("[SocketService] Socket já conectado:", this.socket.id);

      return;
    }

    const accessToken = this.sessionService.getAccessToken();

    if (!accessToken) {
      throw new Error("Não é possível conectar ao Socket.IO sem accessToken.");
    }

    console.log("[SocketService] Criando novo socket...");

    this.socket = io(process.env.SOCKET_URL, {
      auth: {
        token: accessToken,
      },
    });

    this.registerConnectionEvents();
    this.registerPresenceEvents(this.socket);
    this.registerMessageEvents(this.socket);
    this.registerCallEvents();
  }

  private registerConnectionEvents(): void {
    if (!this.socket) {
      return;
    }

    this.socket.on("connect", () => {
      console.log("[SocketService] Socket conectado:", this.socket?.id);
    });

    this.socket.on("connect_error", (error) => {
      console.error("[SocketService] Erro na conexão:", error.message);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[SocketService] Socket desconectado:", reason);
    });
  }

  private registerPresenceEvents(socket: Socket): void {
    console.log("[SocketService] registerPresenceEvents() chamado");

    console.log("[SocketService] socket:", socket.id);

    socket.on("online_users", (data: { userIds: number[] }) => {
      console.log("[SocketService] online_users:", {
        socketId: socket.id,
        userIds: data.userIds,
      });

      this.emitToRenderer("socket:online-users", data);
    });

    socket.on("user_online", (data: { userId: number }) => {
      console.log("[SocketService] user_online:", {
        socketId: socket.id,
        userId: data.userId,
      });

      this.emitToRenderer("socket:user-online", data);
    });

    socket.on("user_offline", (data: { userId: number }) => {
      console.log("[SocketService] user_offline:", {
        socketId: socket.id,
        userId: data.userId,
      });

      this.emitToRenderer("socket:user-offline", data);
    });
  }

  disconnect(): void {
    console.log("[SocketService] disconnect() chamado");

    console.log(
      "[SocketService] Socket antes:",
      this.socket?.id,
      this.socket?.connected
    );

    this.socket?.disconnect();

    this.socket = null;

    console.log("[SocketService] Socket depois:", this.socket);
  }

  sendMessage(receiverId: number, content: string): void {
    if (!this.socket?.connected) {
      throw new Error("Socket.IO não está conectado.");
    }

    this.socket.emit("send_message", {
      receiverId,
      content,
    });
  }

  private registerMessageEvents(socket: Socket): void {
    console.log("[SocketService] registerMessageEvents() chamado");

    console.log("[SocketService] socket:", socket.id);

    socket.on(
      "new_message",
      (data: { senderId: number; receiverId: number; content: string }) => {
        console.log("[SocketService] new_message:", data);

        this.emitToRenderer("socket:new-message", data);
      }
    );
  }

  private emitToRenderer(channel: string, payload: unknown): void {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(channel, payload);
    }
  }

  private registerCallEvents(): void {
    if (!this.socket) {
      return;
    }

    this.socket.on("incoming_call", (data: { callerId: number }) => {
      console.log("[SocketService] incoming_call:", data);

      this.emitToRenderer("socket:incoming-call", data);
    });

    this.socket.on("call_accepted", (data: { receiverId: number }) => {
      console.log("[SocketService] call_accepted:", data);

      this.emitToRenderer("socket:call-accepted", data);
    });

    this.socket.on("call_rejected", (data: { receiverId: number }) => {
      console.log("[SocketService] call_rejected:", data);

      this.emitToRenderer("socket:call-rejected", data);
    });
  }

  requestCall(receiverId: number): void {
    if (!this.socket?.connected) {
      throw new Error("Socket.IO não está conectado.");
    }

    this.socket.emit("call_request", {
      receiverId,
    });
  }

  acceptCall(receiverId: number): void {
    if (!this.socket?.connected) {
      throw new Error("Socket.IO não está conectado.");
    }

    this.socket.emit("call_accepted", {
      receiverId,
    });
  }

  rejectCall(receiverId: number): void {
    if (!this.socket?.connected) {
      throw new Error("Socket.IO não está conectado.");
    }

    this.socket.emit("call_rejected", {
      receiverId,
    });
  }
}

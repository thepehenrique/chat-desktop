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
    this.registerCallEvents(this.socket);
    this.registerCallEvents(this.socket);
    this.registerWebRTCEvents(this.socket);
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

  // socket

  private registerMessageEvents(socket: Socket): void {
    console.log("[SocketService] registerMessageEvents() chamado");

    socket.on(
      "new_message",
      (data: { senderId: number; receiverId: number; content: string }) => {
        console.log("[SocketService] new_message:", data);

        this.emitToRenderer("socket:new-message", data);
      }
    );
  }

  // call

  private registerCallEvents(socket: Socket): void {
    console.log("[SocketService] registerCallEvents() chamado");
    socket.on("incoming_call", (data: { callerId: number }) => {
      console.log("[SocketService] incoming_call:", data);

      this.emitToRenderer("socket:incoming-call", data);
    });

    socket.on("call_accepted", (data: { receiverId: number }) => {
      console.log("[SocketService] call_accepted:", data);

      this.emitToRenderer("socket:call-accepted", data);
    });

    socket.on("call_rejected", (data: { receiverId: number }) => {
      console.log("[SocketService] call_rejected:", data);

      this.emitToRenderer("socket:call-rejected", data);
    });

    socket.on("call_ended", (data: { userId: number }) => {
      console.log("[SocketService] call_ended:", data);

      this.emitToRenderer("socket:call-ended", data);
    });
  }

  requestCall(receiverId: number): void {
    this.validateSocket();

    console.log("[SocketService] Enviando call_request:", {
      receiverId,
    });

    this.socket!.emit("call_request", {
      receiverId,
    });
  }

  acceptCall(receiverId: number): void {
    this.validateSocket();

    console.log("[SocketService] Enviando call_accepted:", {
      receiverId,
    });

    this.socket!.emit("call_accepted", {
      receiverId,
    });
  }

  rejectCall(receiverId: number): void {
    this.validateSocket();

    console.log("[SocketService] Enviando call_rejected:", {
      receiverId,
    });

    this.socket!.emit("call_rejected", {
      receiverId,
    });
  }

  endCall(receiverId: number): void {
    this.validateSocket();

    console.log("[SocketService] Enviando call_ended:", {
      receiverId,
    });

    this.socket!.emit("call_ended", {
      receiverId,
    });
  }

  sendMessage(receiverId: number, content: string): void {
    this.validateSocket();

    this.socket!.emit("send_message", {
      receiverId,
      content,
    });
  }

  private validateSocket(): void {
    if (!this.socket?.connected) {
      throw new Error("Socket.IO não está conectado.");
    }
  }

  private emitToRenderer(channel: string, payload: unknown): void {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(channel, payload);
    }
  }

  // web rtc

  private registerWebRTCEvents(socket: Socket): void {
    console.log("[SocketService] registerWebRTCEvents() chamado");

    socket.on(
      "webrtc_offer",
      (data: { callerId: number; offer: RTCSessionDescriptionInit }) => {
        console.log("[SocketService] webrtc_offer:", data);

        this.emitToRenderer("socket:webrtc-offer", data);
      }
    );

    socket.on(
      "webrtc_answer",
      (data: { receiverId: number; answer: RTCSessionDescriptionInit }) => {
        console.log("[SocketService] webrtc_answer:", data);

        this.emitToRenderer("socket:webrtc-answer", data);
      }
    );

    socket.on(
      "webrtc_ice_candidate",
      (data: { senderId: number; candidate: RTCIceCandidateInit }) => {
        console.log("[SocketService] webrtc_ice_candidate:", data);

        this.emitToRenderer("socket:webrtc-ice-candidate", data);
      }
    );
  }

  sendWebRTCOffer(receiverId: number, offer: RTCSessionDescriptionInit): void {
    this.validateSocket();

    console.log("[SocketService] Enviando webrtc_offer:", {
      receiverId,
      offer,
    });

    this.socket!.emit("webrtc_offer", {
      receiverId,
      offer,
    });
  }

  sendWebRTCAnswer(
    receiverId: number,
    answer: RTCSessionDescriptionInit
  ): void {
    this.validateSocket();

    console.log("[SocketService] Enviando webrtc_answer:", {
      receiverId,
      answer,
    });

    this.socket!.emit("webrtc_answer", {
      receiverId,
      answer,
    });
  }

  sendWebRTCIceCandidate(
    receiverId: number,
    candidate: RTCIceCandidateInit
  ): void {
    this.validateSocket();

    console.log("[SocketService] Enviando webrtc_ice_candidate:", {
      receiverId,
      candidate,
    });

    this.socket!.emit("webrtc_ice_candidate", {
      receiverId,
      candidate,
    });
  }
}

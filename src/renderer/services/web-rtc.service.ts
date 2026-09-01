import { User } from "../interface/user.interface.js";

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;

  private localStream: MediaStream | null = null;

  private remoteStream: MediaStream | null = null;

  private remoteAudio: HTMLAudioElement | null = null;

  private remoteUser: User | null = null;

  private remoteUserId: number | null = null;

  private pendingIceCandidates: RTCIceCandidateInit[] = [];

  private readonly rtcConfiguration: RTCConfiguration = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  async startCall(receiver: User): Promise<void> {
    console.log("[WebRTC] Iniciando chamada para:", receiver.name);

    if (this.peerConnection) {
      console.log(
        "[WebRTC] Já existe uma PeerConnection. Ignorando startCall."
      );

      return;
    }

    this.remoteUser = receiver;

    await this.createPeerConnection();

    await this.createLocalStream();

    this.addLocalTracks();

    const offer = await this.peerConnection!.createOffer();

    await this.peerConnection!.setLocalDescription(offer);

    console.log("[WebRTC] Offer criada.");

    await window.api.socket.sendWebRTCOffer(receiver.id, offer);

    console.log("[WebRTC] Offer enviada para:", receiver.id);
  }

  private async flushPendingIceCandidates(): Promise<void> {
    if (!this.peerConnection) {
      return;
    }

    if (!this.peerConnection.remoteDescription) {
      return;
    }

    if (this.pendingIceCandidates.length === 0) {
      return;
    }

    console.log(
      "[WebRTC] Processando ICE candidates pendentes:",
      this.pendingIceCandidates.length
    );

    const candidates = [...this.pendingIceCandidates];

    this.pendingIceCandidates = [];

    for (const candidate of candidates) {
      try {
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );

        console.log("[WebRTC] ICE pendente adicionada.");
      } catch (error) {
        console.error("[WebRTC] Erro ao adicionar ICE pendente:", error);
      }
    }
  }

  async handleOffer(
    caller: User,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    console.log("[WebRTC] Offer recebida de:", caller.name);

    this.remoteUser = caller;

    await this.createPeerConnection();

    await this.createLocalStream();

    this.addLocalTracks();

    await this.peerConnection!.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    console.log("[WebRTC] Remote description configurada.");

    await this.flushPendingIceCandidates();

    const answer = await this.peerConnection!.createAnswer();

    await this.peerConnection!.setLocalDescription(answer);

    console.log("[WebRTC] Answer criada.");

    await window.api.socket.sendWebRTCAnswer(caller.id, answer);

    console.log("[WebRTC] Answer enviada para:", caller.id);
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      console.error("[WebRTC] PeerConnection não existe.");

      return;
    }

    console.log("[WebRTC] Answer recebida.");

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer)
    );

    console.log("[WebRTC] Remote description configurada através da answer.");
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      console.log("[WebRTC] PeerConnection ainda não existe. Armazenando ICE.");

      this.pendingIceCandidates.push(candidate);

      return;
    }

    if (!this.peerConnection.remoteDescription) {
      console.log(
        "[WebRTC] Remote description ainda não configurada. Armazenando ICE."
      );

      this.pendingIceCandidates.push(candidate);

      return;
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));

      console.log("[WebRTC] ICE candidate adicionada.");
    } catch (error) {
      console.error("[WebRTC] Erro ao adicionar ICE candidate:", error);
    }
  }

  private async createPeerConnection(): Promise<void> {
    if (this.peerConnection) {
      console.log("[WebRTC] PeerConnection já existe.");

      return;
    }

    console.log("[WebRTC] Criando RTCPeerConnection...");

    this.peerConnection = new RTCPeerConnection(this.rtcConfiguration);

    this.registerPeerConnectionEvents();
  }

  private async createLocalStream(): Promise<void> {
    if (this.localStream) {
      return;
    }

    console.log("[WebRTC] Solicitando acesso ao microfone...");

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    console.log("[WebRTC] Microfone autorizado.");
  }

  private addLocalTracks(): void {
    if (!this.peerConnection || !this.localStream) {
      return;
    }

    const senders = this.peerConnection.getSenders();

    for (const track of this.localStream.getTracks()) {
      const alreadyAdded = senders.some((sender) => sender.track === track);

      if (alreadyAdded) {
        continue;
      }

      this.peerConnection.addTrack(track, this.localStream);
    }

    console.log("[WebRTC] Tracks locais adicionadas.");
  }

  private registerPeerConnectionEvents(): void {
    if (!this.peerConnection) {
      return;
    }

    this.peerConnection.onicecandidate = async (event) => {
      if (!event.candidate) {
        return;
      }

      if (!this.remoteUser) {
        console.error("[WebRTC] Usuário remoto não definido para ICE.");

        return;
      }

      console.log("[WebRTC] Novo ICE candidate para:", this.remoteUser.id);

      await window.api.socket.sendWebRTCIceCandidate(
        this.remoteUser.id,
        event.candidate.toJSON()
      );
    };

    this.peerConnection.ontrack = (event) => {
      console.log("[WebRTC] Track remota recebida.");

      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }

      for (const track of event.streams[0]?.getTracks() ?? [event.track]) {
        const alreadyExists = this.remoteStream
          .getTracks()
          .some((existingTrack) => existingTrack.id === track.id);

        if (!alreadyExists) {
          this.remoteStream.addTrack(track);
        }
      }

      this.attachRemoteAudio();
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (!this.peerConnection) {
        return;
      }

      console.log(
        "[WebRTC] Connection state:",
        this.peerConnection.connectionState
      );

      if (
        this.peerConnection.connectionState === "failed" ||
        this.peerConnection.connectionState === "disconnected" ||
        this.peerConnection.connectionState === "closed"
      ) {
        console.log("[WebRTC] Conexão encerrada.");

        this.stop();
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (!this.peerConnection) {
        return;
      }

      console.log(
        "[WebRTC] ICE state:",
        this.peerConnection.iceConnectionState
      );
    };
  }

  private attachRemoteAudio(): void {
    if (!this.remoteStream) {
      return;
    }

    if (!this.remoteAudio) {
      this.remoteAudio = document.createElement("audio");

      this.remoteAudio.autoplay = true;

      this.remoteAudio.controls = false;

      this.remoteAudio.style.display = "none";

      document.body.appendChild(this.remoteAudio);
    }

    this.remoteAudio.srcObject = this.remoteStream;

    void this.remoteAudio.play().catch((error) => {
      console.error("[WebRTC] Erro ao reproduzir áudio remoto:", error);
    });
  }

  stop(): void {
    console.log("[WebRTC] Encerrando conexão...");

    if (this.peerConnection) {
      this.peerConnection.onicecandidate = null;
      this.peerConnection.ontrack = null;
      this.peerConnection.onconnectionstatechange = null;
      this.peerConnection.oniceconnectionstatechange = null;

      this.peerConnection.close();

      this.peerConnection = null;
    }

    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        track.stop();
      }

      this.localStream = null;
    }

    if (this.remoteStream) {
      for (const track of this.remoteStream.getTracks()) {
        track.stop();
      }

      this.remoteStream = null;
    }

    if (this.remoteAudio) {
      this.remoteAudio.pause();
      this.remoteAudio.srcObject = null;
      this.remoteAudio.remove();

      this.remoteAudio = null;
    }

    this.remoteUser = null;
    this.remoteUserId = null;
    this.pendingIceCandidates = [];

    console.log("[WebRTC] Conexão encerrada.");
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  isConnected(): boolean {
    return this.peerConnection?.connectionState === "connected";
  }
}

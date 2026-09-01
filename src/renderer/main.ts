import { LoginPage } from "./pages/login/login.page.js";
import { ChatPage } from "./pages/chat/chat.page.js";
import { AppState } from "./state/app.state.js";
import { RegisterPage } from "./pages/register/register.page.js";
import { VerifyEmailPage } from "./pages/verify-email/verify-email.page.js";
import { WebRTCService } from "./services/web-rtc.service.js";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Elemento #app não encontrado.");
}

const appState = new AppState();
const webRTCService = new WebRTCService();
const loginPage = new LoginPage();
const chatPage = new ChatPage();
const registerPage = new RegisterPage();
const verifyEmailPage = new VerifyEmailPage();

const notificationSound = new Audio("./assets/popup.mp3");

notificationSound.volume = 0.25;

const showLogin = (): void => {
  loginPage.render(app);

  loginPage.bindEvents(
    async (email, password) => {
      const result = await window.api.auth.login(email, password);

      if (!result.success) {
        throw new Error(result.message);
      }

      appState.setAuthenticatedUser(result.user);

      const users = await window.api.users.findAll();

      appState.setUsers(users);

      showChat();
    },

    () => {
      showRegister();
    }
  );
};

const showChat = (): void => {
  const user = appState.getAuthenticatedUser();

  if (!user) {
    showLogin();

    return;
  }

  chatPage.render(
    app,
    user,
    appState.getUsers(),
    appState.getSelectedUser(),
    appState.getMessages(),

    (userId) => appState.isUserOnline(userId),

    (userId) => appState.getUnreadMessages(userId),

    appState.getCallStatus(),

    appState.getCallUser(),

    appState.getCallStartedAt(),

    (selectedUser) => {
      appState.setSelectedUser(selectedUser);

      appState.clearUnreadMessages(selectedUser.id);

      showChat();
    },

    async (receiverId, content) => {
      await window.api.socket.sendMessage(receiverId, content);

      appState.addMessage({
        senderId: user.id,
        receiverId,
        content,
      });

      showChat();
    },

    async (selectedUser) => {
      if (appState.getCallStatus() !== "idle") {
        return;
      }

      appState.setCallStatus("calling");

      appState.setCallUser(selectedUser);

      try {
        // Primeiro avisa o outro usuário que existe uma chamada
        await window.api.socket.callRequest(selectedUser.id);

        console.log("[Renderer] Ligando para:", selectedUser.name);

        showChat();
      } catch (error) {
        console.error("[Renderer] Erro ao iniciar chamada:", error);

        webRTCService.stop();

        appState.clearCall();

        showChat();
      }
    },

    async () => {
      const callUser = appState.getCallUser();

      if (!callUser) {
        appState.clearCall();

        showChat();

        return;
      }

      try {
        console.log("[Renderer] Cancelando chamada com:", callUser.name);

        await window.api.socket.callEnded(callUser.id);
      } catch (error) {
        console.error("[Renderer] Erro ao cancelar chamada:", error);
      } finally {
        appState.clearCall();

        showChat();
      }
    },

    async () => {
      const callUser = appState.getCallUser();

      if (!callUser) {
        console.error("[Renderer] Usuário da chamada não encontrado.");

        return;
      }

      try {
        console.log("[Renderer] Aceitando chamada de:", callUser.name);

        await window.api.socket.callAccepted(callUser.id);

        appState.setCallStatus("connected");

        appState.setCallStartedAt();

        showChat();
      } catch (error) {
        console.error("[Renderer] Erro ao aceitar chamada:", error);

        appState.clearCall();

        showChat();
      }
    },

    async () => {
      const callUser = appState.getCallUser();

      if (!callUser) {
        console.error("[Renderer] Usuário da chamada não encontrado.");

        return;
      }

      try {
        console.log("[Renderer] Recusando chamada de:", callUser.name);

        await window.api.socket.callRejected(callUser.id);
      } catch (error) {
        console.error("[Renderer] Erro ao recusar chamada:", error);
      } finally {
        appState.clearCall();

        showChat();
      }
    },

    async () => {
      const callUser = appState.getCallUser();

      if (!callUser) {
        webRTCService.stop();

        appState.clearCall();

        showChat();

        return;
      }

      try {
        await window.api.socket.callEnded(callUser.id);
      } catch (error) {
        console.error("[Renderer] Erro ao encerrar chamada:", error);
      }

      webRTCService.stop();

      appState.clearCall();

      showChat();
    },

    async () => {
      await window.api.auth.logout();

      appState.clear();

      showLogin();
    }
  );
};

window.api.socket.onOnlineUsers(({ userIds }) => {
  console.log("[Renderer] online_users recebido:", userIds);

  appState.setOnlineUsers(userIds);

  console.log("[Renderer] onlineUsers após set:", appState.getOnlineUsers());

  showChat();
});

window.api.socket.onUserOnline(({ userId }) => {
  console.log("[Renderer] user_online recebido:", userId);

  appState.setUserOnline(userId);

  console.log(
    "[Renderer] onlineUsers após user_online:",
    appState.getOnlineUsers()
  );

  showChat();
});

window.api.socket.onUserOffline(({ userId }) => {
  console.log("[Renderer] user_offline recebido:", userId);

  appState.setUserOffline(userId);

  console.log(
    "[Renderer] onlineUsers após user_offline:",
    appState.getOnlineUsers()
  );

  showChat();
});

window.api.socket.onNewMessage(({ senderId, receiverId, content }) => {
  appState.addMessage({
    senderId,
    receiverId,
    content,
  });

  const selectedUser = appState.getSelectedUser();

  const isConversationOpen = selectedUser?.id === senderId;

  if (!isConversationOpen) {
    appState.incrementUnreadMessages(senderId);
  }

  void notificationSound.play().catch((error) => {
    console.error("Erro ao reproduzir som de notificação:", error);
  });

  showChat();
});

window.api.socket.onIncomingCall(({ callerId }) => {
  console.log("[Renderer] incoming_call:", callerId);

  /*
   * Se já estiver em uma chamada,
   * ignora uma nova chamada.
   */
  if (appState.getCallStatus() !== "idle") {
    console.log("[Renderer] Usuário já está em uma chamada.");

    return;
  }

  const caller = appState.getUsers().find((user) => user.id === callerId);

  if (!caller) {
    console.error("[Renderer] Usuário da chamada não encontrado:", callerId);

    return;
  }

  appState.setCallStatus("incoming");

  appState.setCallUser(caller);

  console.log("[Renderer] Chamada recebida de:", caller.name);

  showChat();
});

window.api.socket.onCallAccepted(async ({ receiverId }) => {
  console.log("[Renderer] call_accepted:", receiverId);

  if (appState.getCallStatus() !== "calling") {
    console.log(
      "[Renderer] Ignorando call_accepted. Status atual:",
      appState.getCallStatus()
    );

    return;
  }

  const receiver = appState.getUsers().find((user) => user.id === receiverId);

  if (!receiver) {
    console.error("[Renderer] Usuário da chamada não encontrado:", receiverId);

    return;
  }

  appState.setCallStatus("connected");
  appState.setCallUser(receiver);
  appState.setCallStartedAt();

  console.log("[Renderer] Chamada aceita por:", receiver.name);

  showChat();

  try {
    await webRTCService.startCall(receiver);

    console.log("[Renderer] WebRTC iniciado com:", receiver.name);
  } catch (error) {
    console.error("[Renderer] Erro ao iniciar WebRTC:", error);

    webRTCService.stop();

    appState.clearCall();

    showChat();
  }
});

window.api.socket.onCallRejected(({ receiverId }) => {
  console.log("[Renderer] call_rejected:", receiverId);

  appState.clearCall();

  console.log("[Renderer] Chamada recusada por:", receiverId);

  showChat();
});

window.api.socket.onCallEnded(({ userId }) => {
  console.log("[Renderer] call_ended recebido de:", userId);

  webRTCService.stop();

  appState.clearCall();

  showChat();
});

const showRegister = (): void => {
  registerPage.render(app);

  registerPage.bindEvents(
    async (name, email, password) => {
      try {
        const userId = await window.api.auth.register(name, email, password);

        console.log("[Renderer] Usuário cadastrado:", userId);

        showVerifyEmail(email);
      } catch (error) {
        console.error("[Renderer] Erro ao realizar cadastro:", error);
      }
    },

    () => {
      showLogin();
    }
  );
};

const showVerifyEmail = (email: string): void => {
  verifyEmailPage.render(app, email);

  verifyEmailPage.bindEvents(
    async (code) => {
      try {
        await window.api.auth.verifyEmail(email, code);

        console.log("[Renderer] E-mail verificado com sucesso.");

        showLogin();
      } catch (error) {
        console.error("[Renderer] Erro ao verificar e-mail:", error);
      }
    },

    async () => {
      try {
        await window.api.auth.resendVerification(email);

        console.log("[Renderer] Código reenviado.");
      } catch (error) {
        console.error("[Renderer] Erro ao reenviar código:", error);
      }
    },

    () => {
      showLogin();
    }
  );
};

window.api.socket.onWebRTCOffer(async ({ callerId, offer }) => {
  console.log("[Renderer] WebRTC Offer recebida de:", callerId);

  const caller = appState.getUsers().find((user) => user.id === callerId);

  if (!caller) {
    console.error("[Renderer] Usuário da offer não encontrado:", callerId);

    return;
  }

  try {
    await webRTCService.handleOffer(caller, offer);

    console.log("[Renderer] WebRTC Offer processada.");
  } catch (error) {
    console.error("[Renderer] Erro ao processar WebRTC Offer:", error);

    webRTCService.stop();
  }
});

window.api.socket.onWebRTCAnswer(async ({ receiverId, answer }) => {
  console.log("[Renderer] WebRTC Answer recebida de:", receiverId);

  try {
    await webRTCService.handleAnswer(answer);

    console.log("[Renderer] WebRTC Answer processada.");
  } catch (error) {
    console.error("[Renderer] Erro ao processar WebRTC Answer:", error);

    webRTCService.stop();

    appState.clearCall();

    showChat();
  }
});

window.api.socket.onWebRTCIceCandidate(async ({ senderId, candidate }) => {
  console.log("[Renderer] ICE Candidate recebida de:", senderId);

  try {
    await webRTCService.handleIceCandidate(candidate);
  } catch (error) {
    console.error("[Renderer] Erro ao processar ICE Candidate:", error);
  }
});

showLogin();

import { LoginPage } from "./pages/login/login.page.js";
import { ChatPage } from "./pages/chat/chat.page.js";
import { AppState } from "./state/app.state.js";
import { RegisterPage } from "./pages/register/register.page.js";
import { VerifyEmailPage } from "./pages/verify-email/verify-email.page.js";
import { WebRTCService } from "./services/web-rtc.service.js";
import { ForgotPasswordPage } from "./pages/password/forgot-password.page.js";
import { ResetPasswordPage } from "./pages/password/reset-password.page.js";

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
const forgotPasswordPage = new ForgotPasswordPage();
const resetPasswordPage = new ResetPasswordPage();

const notificationSound = new Audio("./assets/popup.mp3");

const callSound = new Audio("./assets/call.mp3");
callSound.volume = 0.5;
callSound.loop = true;

let callTimeout: ReturnType<typeof setTimeout> | null = null;

const startCallSound = (): void => {
  callSound.currentTime = 0;

  callSound.play().catch((error) => {
    console.error("[Renderer] Erro ao reproduzir toque da chamada:", error);
  });
};

const stopCallSound = (): void => {
  callSound.pause();
  callSound.currentTime = 0;

  if (callTimeout) {
    clearTimeout(callTimeout);
    callTimeout = null;
  }
};

const startCallTimeout = (): void => {
  if (callTimeout) {
    clearTimeout(callTimeout);
  }

  callTimeout = setTimeout(async () => {
    console.log("[Renderer] Tempo máximo da chamada atingido.");

    stopCallSound();

    const callUser = appState.getCallUser();

    if (callUser) {
      try {
        await window.api.socket.callEnded(callUser.id);
      } catch (error) {
        console.error(
          "[Renderer] Erro ao encerrar chamada por timeout:",
          error
        );
      }
    }

    webRTCService.stop();
    appState.clearCall();
    showChat();
  }, 60_000);
};

const showLogin = (): void => {
  loginPage.render(app);

  loginPage.bindEvents(
    async (email, password) => {
      const result = await window.api.auth.login(email, password);

      if (!result.success) {
        if (result.emailNotVerified) {
          showVerifyEmail(email);
          return;
        }

        throw new Error(result.message);
      }

      appState.setAuthenticatedUser(result.user);

      const users = await window.api.users.findAll();

      appState.setUsers(users);

      showChat();
    },

    () => {
      showRegister();
    },

    () => {
      showForgotPassword();
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

    () => webRTCService.isMuted(),

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
        await window.api.socket.callRequest(selectedUser.id);

        startCallSound();
        startCallTimeout();

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

        stopCallSound();

        appState.setCallStatus("connected");

        appState.setCallStartedAt();

        showChat();
      } catch (error) {
        console.error("[Renderer] Erro ao aceitar chamada:", error);

        stopCallSound();

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

        stopCallSound();
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
        stopCallSound();
        await window.api.socket.callEnded(callUser.id);
      } catch (error) {
        console.error("[Renderer] Erro ao encerrar chamada:", error);
      }

      webRTCService.stop();

      appState.clearCall();

      showChat();
    },

    () => {
      if (webRTCService.isMuted()) {
        webRTCService.unmute();
      } else {
        webRTCService.mute();
      }

      showChat();
    },

    (volume) => {
      webRTCService.setVolume(volume);
    },

    async () => {
      stopCallSound();

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

  startCallSound();
  startCallTimeout();

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

  stopCallSound();

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

  stopCallSound();

  appState.clearCall();

  console.log("[Renderer] Chamada recusada por:", receiverId);

  showChat();
});

window.api.socket.onCallEnded(({ userId }) => {
  console.log("[Renderer] call_ended recebido de:", userId);

  stopCallSound();

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
      const result = await window.api.auth.verifyEmail(email, code);

      //TODO: não sei qq ta rolando aqui mas se tirar para de retornar a mensagem de erro (verificar depois)
      if (!result.success) {
        throw new Error(result.message);
      }

      showLogin();
    },

    async () => {
      await window.api.auth.resendVerification(email);
    },

    () => {
      showLogin();
    }
  );

  verifyEmailPage.startInitialResendCooldown();
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

const showForgotPassword = (): void => {
  forgotPasswordPage.render(app);

  forgotPasswordPage.bindEvents(
    async (email) => {
      await window.api.auth.forgotPassword(email);

      showResetPassword(email);
    },

    () => {
      showLogin();
    }
  );
};

const showResetPassword = (email: string): void => {
  resetPasswordPage.render(app, email);

  resetPasswordPage.bindEvents(
    async (code, password) => {
      await window.api.auth.resetPassword(email, code, password);

      resetPasswordPage.showSuccess();
    },

    () => {
      showLogin();
    }
  );

  window.addEventListener(
    "reset-password-success-login",
    () => {
      showLogin();
    },
    { once: true }
  );
};

showLogin();

import { LoginPage } from "./pages/login/login.page.js";
import { ChatPage } from "./pages/chat/chat.page.js";
import { AppState } from "./state/app.state.js";
import { RegisterPage } from "./pages/register/register.page.js";
import { VerifyEmailPage } from "./pages/verify-email/verify-email.page.js";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Elemento #app não encontrado.");
}

const appState = new AppState();

const loginPage = new LoginPage();
const chatPage = new ChatPage();
const registerPage = new RegisterPage();
const verifyEmailPage = new VerifyEmailPage();

const notificationSound = new Audio("./assets/popup.mp3");

notificationSound.volume = 0.25;

/* ============================================================
   LOGIN
   ============================================================ */

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

/* ============================================================
   CHAT
   ============================================================ */

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

    // Usuário online
    (userId) => appState.isUserOnline(userId),

    // Mensagens não lidas
    (userId) => appState.getUnreadMessages(userId),

    // Status da chamada
    appState.getCallStatus(),

    // Usuário da chamada
    appState.getCallUser(),

    appState.getCallStartedAt(),

    /* ========================================================
       SELECIONAR USUÁRIO
       ======================================================== */

    (selectedUser) => {
      appState.setSelectedUser(selectedUser);

      appState.clearUnreadMessages(selectedUser.id);

      showChat();
    },

    /* ========================================================
       ENVIAR MENSAGEM
       ======================================================== */

    async (receiverId, content) => {
      await window.api.socket.sendMessage(receiverId, content);

      appState.addMessage({
        senderId: user.id,
        receiverId,
        content,
      });

      showChat();
    },

    /* ========================================================
       INICIAR CHAMADA
       ======================================================== */

    async (selectedUser) => {
      appState.setCallStatus("calling");

      appState.setCallUser(selectedUser);

      try {
        await window.api.socket.callRequest(selectedUser.id);

        console.log("[Renderer] Ligando para:", selectedUser.name);

        showChat();
      } catch (error) {
        console.error("[Renderer] Erro ao iniciar chamada:", error);

        appState.clearCall();

        showChat();
      }
    },

    /* ========================================================
       CANCELAR CHAMADA
       ======================================================== */

    async () => {
      console.log("[Renderer] Cancelando chamada.");

      appState.clearCall();

      showChat();
    },

    /* ========================================================
       ACEITAR CHAMADA
       ======================================================== */

    async () => {
      const callUser = appState.getCallUser();

      if (!callUser) {
        return;
      }

      try {
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

    /* ========================================================
       RECUSAR CHAMADA
       ======================================================== */

    async () => {
      const callUser = appState.getCallUser();

      if (!callUser) {
        console.error("[Renderer] Usuário da chamada não encontrado.");

        return;
      }

      try {
        await window.api.socket.callRejected(callUser.id);

        appState.clearCall();

        console.log("[Renderer] Chamada recusada:", callUser.name);

        showChat();
      } catch (error) {
        console.error("[Renderer] Erro ao recusar chamada:", error);

        appState.clearCall();

        showChat();
      }
    },

    /* ========================================================
       DESLIGAR CHAMADA
       ======================================================== */

    async () => {
      console.log("[Renderer] Desligando chamada.");

      appState.clearCall();

      showChat();
    },

    /* ========================================================
       LOGOUT
       ======================================================== */

    async () => {
      await window.api.auth.logout();

      appState.clear();

      showLogin();
    }
  );
};

/* ============================================================
   PRESENCE
   ============================================================ */

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

/* ============================================================
   MESSAGES
   ============================================================ */

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

/* ============================================================
   INCOMING CALL
   ============================================================ */

window.api.socket.onIncomingCall(({ callerId }) => {
  console.log("[Renderer] incoming_call:", callerId);

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

/* ============================================================
   CALL ACCEPTED
   ============================================================ */

window.api.socket.onCallAccepted(({ receiverId }) => {
  console.log("[Renderer] call_accepted:", receiverId);

  const receiver = appState.getUsers().find((user) => user.id === receiverId);

  if (!receiver) {
    return;
  }

  appState.setCallStatus("connected");

  appState.setCallUser(receiver);

  appState.setCallStartedAt();

  console.log("[Renderer] Chamada aceita por:", receiver.name);

  showChat();
});

/* ============================================================
   CALL REJECTED
   ============================================================ */

window.api.socket.onCallRejected(({ receiverId }) => {
  console.log("[Renderer] call_rejected:", receiverId);

  appState.clearCall();

  console.log("[Renderer] Chamada recusada por:", receiverId);

  showChat();
});

/* ============================================================
   REGISTER
   ============================================================ */

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

/* ============================================================
   VERIFY EMAIL
   ============================================================ */

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

/* ============================================================
   START APPLICATION
   ============================================================ */

showLogin();

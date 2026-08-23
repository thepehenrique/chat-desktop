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

const notificationSound = new Audio("./assets/popup.mp3");

notificationSound.volume = 0.25;

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

showLogin();

import { LoginPage } from "./pages/login/login.page.js";
import { ChatPage } from "./pages/chat/chat.page.js";
import { AppState } from "./state/app.state.js";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Elemento #app não encontrado.");
}
const appState = new AppState();
const loginPage = new LoginPage();
const chatPage = new ChatPage();

const showLogin = (): void => {
  loginPage.render(app);

  loginPage.bindEvents(async (email, password) => {
    try {
      const user = await window.api.auth.login(email, password);

      appState.setAuthenticatedUser(user);

      const users = await window.api.users.findAll();

      appState.setUsers(users);

      showChat();
    } catch (error) {
      console.error("Erro ao realizar login:", error);
    }
  });
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

showLogin();

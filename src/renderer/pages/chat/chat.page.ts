import { AuthenticatedUser } from "../../../commom/interface/authenticated-user.interface.js";
import { ChatMessage } from "../../interface/chat-message.interface.js";
import { User } from "../../interface/user.interface.js";

export class ChatPage {
  render(
    container: HTMLElement,
    user: AuthenticatedUser,
    users: User[],
    selectedUser: User | null,
    messages: ChatMessage[],
    isUserOnline: (userId: number) => boolean,
    onSelectUser: (user: User) => void,
    onSendMessage: (receiverId: number, content: string) => Promise<void>,
    onLogout: () => Promise<void>
  ): void {
    const usersHtml = users
      .filter((item) => item.id !== user.id)
      .map((item) => {
        const online = isUserOnline(item.id);

        const selected = selectedUser?.id === item.id;

        return `
          <button
            class="chat__user ${selected ? "chat__user--selected" : ""}"
            data-user-id="${item.id}"
            type="button"
          >
            <span
              class="chat__status ${online ? "chat__status--online" : ""}"
            ></span>

            <span>${item.name}</span>
          </button>
        `;
      })
      .join("");

    const chatTitle = selectedUser?.name ?? "Selecione uma conversa";

    /*
     * Mostra somente as mensagens entre
     * o usuário logado e o usuário selecionado.
     */
    const conversationMessages = selectedUser
      ? messages.filter(
          (message) =>
            (message.senderId === user.id &&
              message.receiverId === selectedUser.id) ||
            (message.senderId === selectedUser.id &&
              message.receiverId === user.id)
        )
      : [];

    const messagesHtml = conversationMessages.length
      ? conversationMessages
          .map((message) => {
            const isOwnMessage = message.senderId === user.id;

            const senderName = isOwnMessage ? user.name : selectedUser?.name;

            return `
          <div
            class="chat__message ${
              isOwnMessage ? "chat__message--own" : "chat__message--received"
            }"
          >
            <span class="chat__message-sender">
              ${senderName}
            </span>

            <p class="chat__message-content">
              ${message.content}
            </p>
          </div>
        `;
          })
          .join("")
      : `
      <p class="chat__empty-message">
        Nenhuma mensagem ainda.
      </p>
    `;

    const conversationContent = selectedUser
      ? `
          <div class="chat__messages">
            ${messagesHtml}
          </div>

          <form
            id="message-form"
            class="chat__message-form"
          >
            <input
              id="message-input"
              type="text"
              placeholder="Digite uma mensagem..."
              autocomplete="off"
            />

            <button type="submit">
              Enviar
            </button>
          </form>
        `
      : `
          <div class="chat__empty">
            <p>
              Olá, ${user.name}.
              Selecione um usuário para
              iniciar uma conversa.
            </p>
          </div>
        `;

    container.innerHTML = `
      <main class="chat">

        <aside class="chat__sidebar">

          <header class="chat__sidebar-header">
            <h2>Conversas</h2>
          </header>

          <div class="chat__users">
            ${usersHtml}
          </div>

        </aside>

        <section class="chat__content">

          <header class="chat__header">

            <h2>${chatTitle}</h2>

            <button
              id="logout-button"
              class="chat__logout"
              type="button"
            >
              Logout
            </button>

          </header>

          <div class="chat__conversation">
            ${conversationContent}
          </div>

        </section>

      </main>
    `;

    this.bindUserSelection(users, isUserOnline, onSelectUser);

    this.bindMessageForm(selectedUser, onSendMessage);

    this.bindLogout(onLogout);
  }

  private bindUserSelection(
    users: User[],
    isUserOnline: (userId: number) => boolean,
    onSelectUser: (user: User) => void
  ): void {
    const buttons = document.querySelectorAll<HTMLButtonElement>(".chat__user");

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const userId = Number(button.dataset.userId);

        const selectedUser = users.find((item) => item.id === userId);

        if (!selectedUser) {
          return;
        }

        if (!isUserOnline(selectedUser.id)) {
          return;
        }

        onSelectUser(selectedUser);
      });
    });
  }

  private bindMessageForm(
    selectedUser: User | null,
    onSendMessage: (receiverId: number, content: string) => Promise<void>
  ): void {
    if (!selectedUser) {
      return;
    }

    const messageForm =
      document.querySelector<HTMLFormElement>("#message-form");

    const messageInput =
      document.querySelector<HTMLInputElement>("#message-input");

    messageForm?.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!messageInput) {
        return;
      }

      const content = messageInput.value.trim();

      if (!content) {
        return;
      }

      try {
        await onSendMessage(selectedUser.id, content);

        messageInput.value = "";

        messageInput.focus();
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
      }
    });
  }

  private bindLogout(onLogout: () => Promise<void>): void {
    const logoutButton =
      document.querySelector<HTMLButtonElement>("#logout-button");

    logoutButton?.addEventListener("click", async () => {
      await onLogout();
    });
  }
}

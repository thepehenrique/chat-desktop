import { AuthenticatedUser } from "../../../commom/interface/authenticated-user.interface";
import { ChatMessage } from "../../interface/chat-message.interface";
import { User } from "../../interface/user.interface";
import { CallStatus } from "../../state/app.state";

export class ChatPage {
  private callTimerInterval: number | null = null;

  render(
    container: HTMLElement,
    user: AuthenticatedUser,
    users: User[],
    selectedUser: User | null,
    messages: ChatMessage[],
    isUserOnline: (userId: number) => boolean,
    getUnreadMessages: (userId: number) => number,
    callStatus: CallStatus,
    callUser: User | null,
    callStartedAt: number | null,
    getIsMuted: () => boolean,
    onSelectUser: (user: User) => void,
    onSendMessage: (receiverId: number, content: string) => Promise<void>,
    onCall: (user: User) => Promise<void>,
    onCancelCall: () => Promise<void>,
    onAcceptCall: () => Promise<void>,
    onRejectCall: () => Promise<void>,
    onEndCall: () => Promise<void>,
    onToggleMute: () => void,
    onLogout: () => Promise<void>
  ): void {
    const availableUsers = users.filter((item) => item.id !== user.id);

    const onlineUsers = availableUsers.filter((item) => isUserOnline(item.id));

    const offlineUsers = availableUsers.filter(
      (item) => !isUserOnline(item.id)
    );

    const renderUser = (item: User): string => {
      const online = isUserOnline(item.id);

      console.log("[ChatPage] usuário:", item.id, item.name, "online:", online);

      const selected = selectedUser?.id === item.id;

      const unreadCount = getUnreadMessages(item.id);

      return `
        <button
          class="chat__user ${selected ? "chat__user--selected" : ""}"
          data-user-id="${item.id}"
          type="button"
        >
          <span
            class="chat__status ${online ? "chat__status--online" : ""}"
          ></span>

          <span class="chat__user-name">
            ${item.name}
          </span>

          ${
            unreadCount > 0
              ? `
                <span class="chat__user-notification">
                  ${unreadCount}
                </span>
              `
              : ""
          }
        </button>
      `;
    };

    const onlineUsersHtml = onlineUsers.map(renderUser).join("");

    const offlineUsersHtml = offlineUsers.map(renderUser).join("");

    const chatTitle = selectedUser?.name ?? "Selecione uma conversa";

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
                    isOwnMessage
                      ? "chat__message--own"
                      : "chat__message--received"
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

    const callModal = this.renderCallModal(callStatus, callUser, getIsMuted);

    container.innerHTML = `
      <main class="chat">

        <aside class="chat__sidebar">

          <header class="chat__sidebar-header">
            <h2>Conversas</h2>
          </header>

          <div class="chat__users">

            <section class="chat__users-section">

              <h3 class="chat__users-title">
                Online
              </h3>

              ${
                onlineUsersHtml ||
                `
                  <p class="chat__users-empty">
                    Nenhum usuário online
                  </p>
                `
              }

            </section>

            <section class="chat__users-section">

              <h3 class="chat__users-title">
                Offline
              </h3>

              ${
                offlineUsersHtml ||
                `
                  <p class="chat__users-empty">
                    Nenhum usuário offline
                  </p>
                `
              }

            </section>

          </div>

        </aside>

        <section class="chat__content">

          <header class="chat__header">

            <h2>${chatTitle}</h2>

            <div class="chat__actions">

              ${
                selectedUser
                  ? `
                    <button
                      id="call-button"
                      class="chat__call"
                      type="button"
                    >
                      <span>📞</span>
                      Ligar
                    </button>
                  `
                  : ""
              }

              <button
                id="logout-button"
                class="chat__logout"
                type="button"
              >
                <span>↪</span>
                Logout
              </button>

            </div>

          </header>

          <div class="chat__conversation">
            ${conversationContent}
          </div>

        </section>

      </main>

      ${callModal}
    `;

    this.bindUserSelection(users, isUserOnline, onSelectUser);

    this.bindMessageForm(selectedUser, onSendMessage);

    this.bindCallButton(selectedUser, onCall);

    this.bindCallActions(
      callStatus,
      onCancelCall,
      onAcceptCall,
      onRejectCall,
      onEndCall,
      onToggleMute
    );

    if (callStatus === "connected" && callStartedAt !== null) {
      this.startCallTimer(callStartedAt);
    } else {
      this.stopCallTimer();
    }

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

  private bindCallButton(
    selectedUser: User | null,
    onCall: (user: User) => Promise<void>
  ): void {
    const callButton =
      document.querySelector<HTMLButtonElement>("#call-button");

    if (!callButton || !selectedUser) {
      return;
    }

    callButton.addEventListener("click", async () => {
      try {
        await onCall(selectedUser);
      } catch (error) {
        console.error("[ChatPage] Erro ao iniciar chamada:", error);
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

  private renderCallModal(
    callStatus: CallStatus,
    callUser: User | null,
    getIsMuted: () => boolean
  ): string {
    if (callStatus === "idle" || !callUser) {
      return "";
    }

    if (callStatus === "calling") {
      return `
      <div class="call-overlay">

        <div class="call-modal">

          <div class="call-modal__icon">
            📞
          </div>

          <h2>
            Ligando...
          </h2>

          <p>
            ${callUser.name}
          </p>

          <button
            id="cancel-call-button"
            class="call-modal__button call-modal__button--danger"
            type="button"
          >
            Cancelar
          </button>

        </div>

      </div>
    `;
    }

    if (callStatus === "incoming") {
      return `
      <div class="call-overlay">

        <div class="call-modal">

          <div class="call-modal__icon">
            📞
          </div>

          <h2>
            Chamada recebida
          </h2>

          <p>
            ${callUser.name} está ligando...
          </p>

          <div class="call-modal__actions">

            <button
              id="reject-call-button"
              class="call-modal__button call-modal__button--danger"
              type="button"
            >
              Recusar
            </button>

            <button
              id="accept-call-button"
              class="call-modal__button call-modal__button--success"
              type="button"
            >
              Aceitar
            </button>

          </div>

        </div>

      </div>
    `;
    }

    if (callStatus === "connected") {
      const isMuted = getIsMuted();

      return `
    <div class="call-overlay">

      <div class="call-modal">

        <div class="call-modal__icon">
          📞
        </div>

        <h2>
          Em chamada
        </h2>

        <p>
          ${callUser.name}
        </p>

        <span
          id="call-timer"
          class="call-modal__timer"
        >
          00:00
        </span>

        <div class="call-modal__actions">

          <button
            id="mute-call-button"
            class="call-modal__button"
            type="button"
          >
            ${isMuted ? "🔇 Desmutar" : "🎤 Mutar"}
          </button>

          <button
            id="end-call-button"
            class="call-modal__button call-modal__button--danger"
            type="button"
          >
            📞 Desligar
          </button>

        </div>

      </div>

    </div>
  `;
    }

    return "";
  }

  private bindCallActions(
    callStatus: CallStatus,
    onCancelCall: () => Promise<void>,
    onAcceptCall: () => Promise<void>,
    onRejectCall: () => Promise<void>,
    onEndCall: () => Promise<void>,
    onToggleMute: () => void
  ): void {
    if (callStatus === "calling") {
      const button = document.querySelector<HTMLButtonElement>(
        "#cancel-call-button"
      );

      button?.addEventListener("click", async () => {
        try {
          await onCancelCall();
        } catch (error) {
          console.error("[ChatPage] Erro ao cancelar chamada:", error);
        }
      });

      return;
    }

    if (callStatus === "incoming") {
      const acceptButton = document.querySelector<HTMLButtonElement>(
        "#accept-call-button"
      );

      const rejectButton = document.querySelector<HTMLButtonElement>(
        "#reject-call-button"
      );

      acceptButton?.addEventListener("click", async () => {
        try {
          await onAcceptCall();
        } catch (error) {
          console.error("[ChatPage] Erro ao aceitar chamada:", error);
        }
      });

      rejectButton?.addEventListener("click", async () => {
        try {
          await onRejectCall();
        } catch (error) {
          console.error("[ChatPage] Erro ao recusar chamada:", error);
        }
      });

      return;
    }

    if (callStatus === "connected") {
      const muteButton =
        document.querySelector<HTMLButtonElement>("#mute-call-button");

      const endButton =
        document.querySelector<HTMLButtonElement>("#end-call-button");

      muteButton?.addEventListener("click", () => {
        try {
          onToggleMute();

          const isMuted = muteButton.dataset.muted === "true";

          muteButton.dataset.muted = String(!isMuted);

          const icon =
            muteButton.querySelector<HTMLSpanElement>("#mute-call-icon");

          const text =
            muteButton.querySelector<HTMLSpanElement>("#mute-call-text");

          if (!isMuted) {
            icon!.textContent = "🔇";
            text!.textContent = "Desmutar";
          } else {
            icon!.textContent = "🎤";
            text!.textContent = "Mutar";
          }
        } catch (error) {
          console.error("[ChatPage] Erro ao alterar mute:", error);
        }
      });

      endButton?.addEventListener("click", async () => {
        try {
          await onEndCall();
        } catch (error) {
          console.error("[ChatPage] Erro ao desligar chamada:", error);
        }
      });
    }
  }

  private stopCallTimer(): void {
    if (this.callTimerInterval === null) {
      return;
    }

    window.clearInterval(this.callTimerInterval);

    this.callTimerInterval = null;
  }

  private startCallTimer(callStartedAt: number): void {
    this.stopCallTimer();

    const updateTimer = (): void => {
      const timer = document.querySelector<HTMLSpanElement>("#call-timer");

      if (!timer) {
        return;
      }

      const elapsed = Date.now() - callStartedAt;

      const totalSeconds = Math.floor(elapsed / 1000);

      const minutes = Math.floor(totalSeconds / 60);

      const seconds = totalSeconds % 60;

      timer.textContent =
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`;
    };

    updateTimer();

    this.callTimerInterval = window.setInterval(updateTimer, 1000);
  }
}

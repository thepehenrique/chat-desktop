import type { AuthenticatedUser } from "../../state/app.state.js";
import type { User } from "../../state/user.types.js";

export class ChatPage {
  render(
    container: HTMLElement,
    user: AuthenticatedUser,
    users: User[],
    isUserOnline: (userId: number) => boolean,
    onLogout: () => Promise<void>
  ): void {
    {
      const usersHtml = users
        .filter((item) => item.id !== user.id)
        .map((item) => {
          const online = isUserOnline(item.id);

          return `
      <button
        class="chat__user"
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
            <h2>Selecione uma conversa</h2>

            <button
              id="logout-button"
              class="chat__logout"
              type="button"
            >
              Logout
            </button>
          </header>

          <div class="chat__empty">
            <p>
              Olá, ${user.name}.
              Selecione um usuário para iniciar uma conversa.
            </p>
          </div>

        </section>

      </main>
    `;

      const logoutButton =
        document.querySelector<HTMLButtonElement>("#logout-button");

      logoutButton?.addEventListener("click", async () => {
        await onLogout();
      });
    }
  }
}

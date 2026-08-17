export class LoginPage {
  render(container: HTMLElement): void {
    container.innerHTML = `
      <main class="app">
        <section class="login">
          <h1>Chat Desktop</h1>

          <p>
            Entre para continuar
          </p>

          <form id="login-form">
            <input
              id="email"
              type="email"
              placeholder="E-mail"
              autocomplete="username"
              required
            />

            <input
              id="password"
              type="password"
              placeholder="Senha"
              autocomplete="current-password"
              required
            />

            <button type="submit">
              Entrar
            </button>
          </form>
        </section>
      </main>
    `;
  }

  bindEvents(
    onSubmit: (email: string, password: string) => Promise<void>
  ): void {
    const form = document.querySelector<HTMLFormElement>("#login-form");

    if (!form) {
      throw new Error("Formulário de login não encontrado.");
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.querySelector<HTMLInputElement>("#email");

      const password = document.querySelector<HTMLInputElement>("#password");

      if (!email || !password) {
        return;
      }

      await onSubmit(email.value, password.value);
    });
  }
}

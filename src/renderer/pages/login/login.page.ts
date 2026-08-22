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

            <button
              id="login-button"
              type="submit"
            >
              <span class="login__button-text">
                Entrar
              </span>

              <span class="login__button-loading">
                Entrando...
              </span>
            </button>

          </form>

          <button
            id="register-button"
            class="login__register-button"
            type="button"
          >
            Criar uma conta
          </button>
        </section>
      </main>
    `;
  }

  bindEvents(
    onSubmit: (email: string, password: string) => Promise<void>,
    onRegister: () => void
  ): void {
    const form = document.querySelector<HTMLFormElement>("#login-form");

    const email = document.querySelector<HTMLInputElement>("#email");

    const password = document.querySelector<HTMLInputElement>("#password");

    const loginButton =
      document.querySelector<HTMLButtonElement>("#login-button");

    const registerButton =
      document.querySelector<HTMLButtonElement>("#register-button");

    if (!form) {
      throw new Error("Formulário de login não encontrado.");
    }

    if (!email || !password) {
      throw new Error("Campos de login não encontrados.");
    }

    if (!loginButton) {
      throw new Error("Botão de login não encontrado.");
    }

    if (!registerButton) {
      throw new Error("Botão de cadastro não encontrado.");
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const emailValue = email.value.trim();
      const passwordValue = password.value;

      if (!emailValue || !passwordValue) {
        return;
      }

      this.setLoading(true);

      try {
        await onSubmit(emailValue, passwordValue);
      } catch (error) {
        this.setLoading(false);

        throw error;
      }
    });

    registerButton.addEventListener("click", () => {
      onRegister();
    });
  }

  private setLoading(loading: boolean): void {
    const loginButton =
      document.querySelector<HTMLButtonElement>("#login-button");

    if (!loginButton) {
      return;
    }

    loginButton.disabled = loading;

    loginButton.classList.toggle("is-loading", loading);
  }
}

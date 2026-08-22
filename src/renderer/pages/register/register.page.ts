export class RegisterPage {
  render(container: HTMLElement): void {
    container.innerHTML = `
      <main class="app">
        <section class="register">
          <h1>Criar conta</h1>

          <p>
            Preencha os dados para criar sua conta.
          </p>

          <form id="register-form">

            <input
              id="name"
              type="text"
              placeholder="Nome"
              autocomplete="name"
              required
            />

            <input
              id="email"
              type="email"
              placeholder="E-mail"
              autocomplete="email"
              required
            />

            <input
              id="password"
              type="password"
              placeholder="Senha"
              autocomplete="new-password"
              minlength="8"
              required
            />

            <button type="submit">
              Criar conta
            </button>

          </form>

          <button
            id="back-to-login"
            class="register__back-button"
            type="button"
          >
            Já tenho uma conta
          </button>
        </section>
      </main>
    `;
  }

  bindEvents(
    onSubmit: (name: string, email: string, password: string) => Promise<void>,
    onBackToLogin: () => void
  ): void {
    const form = document.querySelector<HTMLFormElement>("#register-form");

    const backButton =
      document.querySelector<HTMLButtonElement>("#back-to-login");

    if (!form) {
      throw new Error("Formulário de cadastro não encontrado.");
    }

    if (!backButton) {
      throw new Error("Botão de voltar para o login não encontrado.");
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const name = document.querySelector<HTMLInputElement>("#name");

      const email = document.querySelector<HTMLInputElement>("#email");

      const password = document.querySelector<HTMLInputElement>("#password");

      if (!name || !email || !password) {
        return;
      }

      await onSubmit(name.value.trim(), email.value.trim(), password.value);
    });

    backButton.addEventListener("click", () => {
      onBackToLogin();
    });
  }
}

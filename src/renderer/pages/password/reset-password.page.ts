export class ResetPasswordPage {
  render(container: HTMLElement, email: string): void {
    container.innerHTML = `
      <main class="app">
        <section class="reset-password">

          <h1>Redefinir senha</h1>

          <p>
            Informe o código enviado para:
          </p>

          <strong class="reset-password__address">
            ${email}
          </strong>

          <form id="reset-password-form">

            <input
              id="reset-password-code"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="Código de 6 dígitos"
              autocomplete="one-time-code"
              required
            />

            <input
              id="reset-password-password"
              type="password"
              placeholder="Nova senha"
              autocomplete="new-password"
              required
            />

            <input
              id="reset-password-confirm"
              type="password"
              placeholder="Confirmar nova senha"
              autocomplete="new-password"
              required
            />

            <p
              id="reset-password-error"
              class="reset-password__error"
              role="alert"
            ></p>

            <button
              id="reset-password-button"
              type="submit"
            >
              <span class="reset-password__button-text">
                Alterar senha
              </span>

              <span class="reset-password__button-loading">
                Alterando...
              </span>
            </button>

          </form>

          <button
            id="reset-password-back"
            class="reset-password__back"
            type="button"
          >
            Voltar para o login
          </button>

        </section>
      </main>
    `;
  }

  bindEvents(
    onSubmit: (code: string, password: string) => Promise<void>,
    onBackToLogin: () => void
  ): void {
    const form = document.querySelector<HTMLFormElement>(
      "#reset-password-form"
    );

    const codeInput = document.querySelector<HTMLInputElement>(
      "#reset-password-code"
    );

    const passwordInput = document.querySelector<HTMLInputElement>(
      "#reset-password-password"
    );

    const confirmInput = document.querySelector<HTMLInputElement>(
      "#reset-password-confirm"
    );

    const submitButton = document.querySelector<HTMLButtonElement>(
      "#reset-password-button"
    );

    const backButton = document.querySelector<HTMLButtonElement>(
      "#reset-password-back"
    );

    if (!form) {
      throw new Error("Formulário de redefinição de senha não encontrado.");
    }

    if (!codeInput) {
      throw new Error("Campo de código não encontrado.");
    }

    if (!passwordInput || !confirmInput) {
      throw new Error("Campos de senha não encontrados.");
    }

    if (!submitButton) {
      throw new Error("Botão de alteração de senha não encontrado.");
    }

    if (!backButton) {
      throw new Error("Botão de voltar para o login não encontrado.");
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const code = codeInput.value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmInput.value;

      if (code.length !== 6) {
        this.showError("O código deve possuir 6 dígitos.");

        return;
      }

      if (!password || !confirmPassword) {
        this.showError("Informe a nova senha.");

        return;
      }

      if (password !== confirmPassword) {
        this.showError("As senhas não são iguais.");

        return;
      }

      this.clearError();

      this.setLoading(true);

      try {
        await onSubmit(code, password);
      } catch (error) {
        this.setLoading(false);

        if (error instanceof Error) {
          this.showError(error.message);
        } else {
          this.showError("Não foi possível alterar a senha.");
        }
      }
    });

    backButton.addEventListener("click", () => {
      onBackToLogin();
    });
  }

  showSuccess(): void {
    const section = document.querySelector<HTMLElement>(".reset-password");

    if (!section) {
      return;
    }

    section.innerHTML = `
      <h1>Senha alterada!</h1>

      <p class="reset-password__success">
        Sua senha foi alterada com sucesso.
      </p>

      <button
        id="reset-password-success-login"
        type="button"
      >
        Voltar para o login
      </button>
    `;

    const loginButton = document.querySelector<HTMLButtonElement>(
      "#reset-password-success-login"
    );

    loginButton?.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("reset-password-success-login"));
    });
  }

  private setLoading(loading: boolean): void {
    const button = document.querySelector<HTMLButtonElement>(
      "#reset-password-button"
    );

    if (!button) {
      return;
    }

    button.disabled = loading;

    button.classList.toggle("is-loading", loading);
  }

  private showError(message: string): void {
    const errorElement = document.querySelector<HTMLParagraphElement>(
      "#reset-password-error"
    );

    if (!errorElement) {
      return;
    }

    errorElement.textContent = message;

    errorElement.style.display = "block";
  }

  private clearError(): void {
    const errorElement = document.querySelector<HTMLParagraphElement>(
      "#reset-password-error"
    );

    if (!errorElement) {
      return;
    }

    errorElement.textContent = "";

    errorElement.style.display = "none";
  }
}

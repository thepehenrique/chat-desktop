export class ForgotPasswordPage {
  render(container: HTMLElement): void {
    container.innerHTML = `
      <main class="app">
        <section class="forgot-password">

          <h1>Recuperar senha</h1>

          <p>
            Informe seu e-mail para receber o código de recuperação.
          </p>

          <form id="forgot-password-form">

            <input
              id="forgot-password-email"
              type="email"
              placeholder="E-mail"
              autocomplete="email"
              required
            />

            <p
              id="forgot-password-error"
              class="forgot-password__error"
              role="alert"
            ></p>

            <button
              id="forgot-password-button"
              type="submit"
            >
              <span class="forgot-password__button-text">
                Enviar código
              </span>

              <span class="forgot-password__button-loading">
                Enviando...
              </span>
            </button>

          </form>

          <button
            id="forgot-password-back"
            class="forgot-password__back"
            type="button"
          >
            Voltar para o login
          </button>

        </section>
      </main>
    `;
  }

  bindEvents(
    onSubmit: (email: string) => Promise<void>,
    onBackToLogin: () => void
  ): void {
    const form = document.querySelector<HTMLFormElement>(
      "#forgot-password-form"
    );

    const emailInput = document.querySelector<HTMLInputElement>(
      "#forgot-password-email"
    );

    const submitButton = document.querySelector<HTMLButtonElement>(
      "#forgot-password-button"
    );

    const backButton = document.querySelector<HTMLButtonElement>(
      "#forgot-password-back"
    );

    if (!form) {
      throw new Error("Formulário de recuperação de senha não encontrado.");
    }

    if (!emailInput) {
      throw new Error(
        "Campo de e-mail da recuperação de senha não encontrado."
      );
    }

    if (!submitButton) {
      throw new Error("Botão de recuperação de senha não encontrado.");
    }

    if (!backButton) {
      throw new Error("Botão de voltar para o login não encontrado.");
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = emailInput.value.trim();

      if (!email) {
        return;
      }

      this.clearError();

      this.setLoading(true);

      try {
        await onSubmit(email);
      } catch (error) {
        this.setLoading(false);

        if (error instanceof Error) {
          this.showError(error.message);
        } else {
          this.showError("Não foi possível solicitar a recuperação da senha.");
        }
      }
    });

    backButton.addEventListener("click", () => {
      onBackToLogin();
    });
  }

  private setLoading(loading: boolean): void {
    const button = document.querySelector<HTMLButtonElement>(
      "#forgot-password-button"
    );

    if (!button) {
      return;
    }

    button.disabled = loading;

    button.classList.toggle("is-loading", loading);
  }

  private showError(message: string): void {
    const errorElement = document.querySelector<HTMLParagraphElement>(
      "#forgot-password-error"
    );

    if (!errorElement) {
      return;
    }

    errorElement.textContent = message;

    errorElement.style.display = "block";
  }

  private clearError(): void {
    const errorElement = document.querySelector<HTMLParagraphElement>(
      "#forgot-password-error"
    );

    if (!errorElement) {
      return;
    }

    errorElement.textContent = "";

    errorElement.style.display = "none";
  }
}

export class VerifyEmailPage {
  private resendTimeout: number | null = null;
  private resendSeconds = 60;

  render(container: HTMLElement, email: string): void {
    container.innerHTML = `
      <main class="app">
        <section class="verify-email">

          <h1>Verificar e-mail</h1>

          <p>
            Enviamos um código de verificação para:
          </p>

          <strong class="verify-email__address">
            ${email}
          </strong>

          <form id="verify-email-form">

            <input
              id="verification-code"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="Código de 6 dígitos"
              autocomplete="one-time-code"
              required
            />

            <p
              id="verify-email-error"
              class="verify-email__error"
              role="alert"
            ></p>

            <button type="submit">
              Verificar
            </button>

          </form>

          <button
            id="resend-verification"
            class="verify-email__resend"
            type="button"
          >
            Reenviar código
          </button>

          <button
            id="back-to-login"
            class="verify-email__back"
            type="button"
          >
            Voltar para o login
          </button>

        </section>
      </main>
    `;
  }

  bindEvents(
    onVerify: (code: string) => Promise<void>,
    onResend: () => Promise<void>,
    onBackToLogin: () => void
  ): void {
    const form = document.querySelector<HTMLFormElement>("#verify-email-form");

    const codeInput =
      document.querySelector<HTMLInputElement>("#verification-code");

    const resendButton = document.querySelector<HTMLButtonElement>(
      "#resend-verification"
    );

    const backButton =
      document.querySelector<HTMLButtonElement>("#back-to-login");

    if (!form) {
      throw new Error("Formulário de verificação não encontrado.");
    }

    if (!codeInput) {
      throw new Error("Campo de código não encontrado.");
    }

    if (!resendButton) {
      throw new Error("Botão de reenviar código não encontrado.");
    }

    if (!backButton) {
      throw new Error("Botão de voltar para o login não encontrado.");
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const code = codeInput.value.trim();

      if (code.length !== 6) return;

      this.clearError();

      try {
        await onVerify(code);

        // Código foi aceito.
        // A partir daqui começa o prazo de 1 minuto
        // para solicitar outro código.
        this.startResendCooldown(resendButton);
      } catch (error) {
        console.error("Erro ao verificar e-mail:", error);

        if (error instanceof Error) {
          this.showError(error.message);
        } else {
          this.showError("Não foi possível verificar o e-mail.");
        }
      }
    });

    resendButton.addEventListener("click", async () => {
      if (resendButton.disabled) {
        return;
      }

      this.clearError();

      try {
        await onResend();

        // Novo código enviado.
        // Reinicia o contador de 1 minuto.
        this.startResendCooldown(resendButton);
      } catch (error) {
        console.error("Erro ao reenviar código:", error);

        if (error instanceof Error) {
          this.showError(error.message);
        } else {
          this.showError("Não foi possível reenviar o código.");
        }
      }
    });

    backButton.addEventListener("click", () => {
      onBackToLogin();
    });
  }

  private startResendCooldown(button: HTMLButtonElement): void {
    if (this.resendTimeout !== null) {
      window.clearInterval(this.resendTimeout);
    }

    this.resendSeconds = 60;
    button.disabled = true;

    button.textContent = `Reenviar código (${this.resendSeconds}s)`;

    this.resendTimeout = window.setInterval(() => {
      this.resendSeconds--;

      if (this.resendSeconds <= 0) {
        this.stopResendCooldown(button);
        return;
      }

      button.textContent = `Reenviar código (${this.resendSeconds}s)`;
    }, 1000);
  }

  private stopResendCooldown(button: HTMLButtonElement): void {
    if (this.resendTimeout !== null) {
      window.clearInterval(this.resendTimeout);
      this.resendTimeout = null;
    }

    button.disabled = false;
    button.textContent = "Reenviar código";
  }

  private showError(message: string): void {
    const errorElement = document.querySelector<HTMLParagraphElement>(
      "#verify-email-error"
    );

    if (!errorElement) {
      return;
    }

    errorElement.textContent = message;
    errorElement.style.display = "block";
  }

  private clearError(): void {
    const errorElement = document.querySelector<HTMLElement>(
      "#verify-email-error"
    );

    if (!errorElement) return;

    errorElement.textContent = "";
    errorElement.style.display = "none";
  }

  startInitialResendCooldown(): void {
    const resendButton = document.querySelector<HTMLButtonElement>(
      "#resend-verification"
    );

    if (!resendButton) {
      return;
    }

    this.startResendCooldown(resendButton);
  }
}

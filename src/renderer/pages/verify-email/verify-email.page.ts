export class VerifyEmailPage {
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

      if (code.length !== 6) {
        return;
      }

      await onVerify(code);
    });

    resendButton.addEventListener("click", async () => {
      try {
        await onResend();
      } catch (error) {
        console.error("Erro ao reenviar código:", error);
      }
    });

    backButton.addEventListener("click", () => {
      onBackToLogin();
    });
  }
}

import { User } from "../../interface/user.interface.js";

export class CallModal {
  showIncomingCall(
    caller: User,
    onAccept: () => void,
    onReject: () => void
  ): void {
    const existing = document.querySelector("#call-modal");

    existing?.remove();

    const modal = document.createElement("div");

    modal.id = "call-modal";

    modal.innerHTML = `
      <div class="call-modal__overlay">

        <div class="call-modal__content">

          <div class="call-modal__icon">
            📞
          </div>

          <h2>
            Chamada recebida
          </h2>

          <p>
            ${caller.name} está ligando...
          </p>

          <div class="call-modal__actions">

            <button
              id="call-reject-button"
              type="button"
            >
              Recusar
            </button>

            <button
              id="call-accept-button"
              type="button"
            >
              Aceitar
            </button>

          </div>

        </div>

      </div>
    `;

    document.body.appendChild(modal);

    const acceptButton = document.querySelector<HTMLButtonElement>(
      "#call-accept-button"
    );

    const rejectButton = document.querySelector<HTMLButtonElement>(
      "#call-reject-button"
    );

    acceptButton?.addEventListener("click", () => {
      this.close();

      onAccept();
    });

    rejectButton?.addEventListener("click", () => {
      this.close();

      onReject();
    });
  }

  close(): void {
    const modal = document.querySelector("#call-modal");

    modal?.remove();
  }
}

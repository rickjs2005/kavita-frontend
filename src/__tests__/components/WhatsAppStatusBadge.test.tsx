// Etapa 5 — badge reusável de status de mensagem WhatsApp.

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhatsAppStatusBadge } from "@/components/painel-corretora/WhatsAppStatusBadge";

describe("WhatsAppStatusBadge", () => {
  it("renderiza label correta para cada status", () => {
    const cases: Array<[Parameters<typeof WhatsAppStatusBadge>[0]["status"], string]> = [
      ["queued", "Em fila"],
      ["queued_stub", "Simulado"],
      ["manual_pending", "Aguardando envio"],
      ["sent", "Enviado"],
      ["delivered", "Entregue"],
      ["read", "Lido"],
      ["failed", "Falhou"],
    ];

    for (const [status, label] of cases) {
      const { unmount } = render(<WhatsAppStatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it("mantém aria-label acessível", () => {
    render(<WhatsAppStatusBadge status="delivered" />);
    expect(
      screen.getByLabelText(/Status WhatsApp:\s*Entregue/i),
    ).toBeInTheDocument();
  });

  it("compact=true esconde o ponto pulsante", () => {
    const { container, rerender } = render(
      <WhatsAppStatusBadge status="queued" compact={false} />,
    );
    // Ponto presente
    expect(container.querySelector(".animate-pulse")).toBeTruthy();

    rerender(<WhatsAppStatusBadge status="queued" compact={true} />);
    expect(container.querySelector(".animate-pulse")).toBeFalsy();
  });
});

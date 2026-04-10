/**
 * HeroAtendimento.test.tsx
 *
 * Cobertura:
 * - Renderizacao com defaults
 * - Renderizacao com config
 * - CTA WhatsApp aparece so com whatsappUrl
 * - Tracking ao clicar WhatsApp
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HeroAtendimento from "@/app/contato/components/HeroAtendimento";

const trackMock = vi.fn();

vi.mock("../../../app/contato/trackContatoEvent", () => ({
  trackContatoEvent: (...args: unknown[]) => trackMock(...args),
}));

describe("HeroAtendimento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza titulo, highlight e descricao default", () => {
    render(<HeroAtendimento />);

    expect(screen.getByText(/Precisa de ajuda/i)).toBeInTheDocument();
    expect(screen.getByText(/Estamos com voce/i)).toBeInTheDocument();
    expect(screen.getByText(/Central de Ajuda Kavita/i)).toBeInTheDocument();
  });

  it("usa textos do config quando fornecido", () => {
    render(
      <HeroAtendimento
        config={
          {
            hero_badge: "Badge custom",
            hero_title: "Titulo custom",
            hero_highlight: "Destaque custom",
            hero_description: "Descricao custom",
            hero_status: "Status custom",
            hero_schedule: "Horario custom",
            hero_sla: "SLA custom",
            hero_cta_primary: "CTA primario custom",
            hero_cta_secondary: "CTA secundario custom",
          } as any
        }
        whatsappUrl="https://wa.me/5531999990000"
      />
    );

    expect(screen.getByText("Badge custom")).toBeInTheDocument();
    expect(screen.getByText("Titulo custom")).toBeInTheDocument();
    expect(screen.getByText("Destaque custom")).toBeInTheDocument();
    expect(screen.getByText("Descricao custom")).toBeInTheDocument();
    expect(screen.getByText("Status custom")).toBeInTheDocument();
    expect(screen.getByText("Horario custom")).toBeInTheDocument();
    expect(screen.getByText("SLA custom")).toBeInTheDocument();
    expect(screen.getByText("CTA primario custom")).toBeInTheDocument();
    expect(screen.getByText("CTA secundario custom")).toBeInTheDocument();
  });

  it("CTA WhatsApp NAO aparece sem whatsappUrl", () => {
    render(<HeroAtendimento />);

    expect(screen.queryByText(/Falar pelo WhatsApp/i)).not.toBeInTheDocument();
  });

  it("CTA WhatsApp aparece quando whatsappUrl e fornecido", () => {
    render(<HeroAtendimento whatsappUrl="https://wa.me/5531999990000" />);

    expect(screen.getByText(/Falar pelo WhatsApp/i)).toBeInTheDocument();
  });

  it("CTA secundario sempre aparece", () => {
    render(<HeroAtendimento />);

    expect(screen.getByText(/Enviar mensagem/i)).toBeInTheDocument();
  });

  it("clicar no CTA WhatsApp dispara evento de tracking", () => {
    render(<HeroAtendimento whatsappUrl="https://wa.me/5531999990000" />);

    const link = screen.getByText(/Falar pelo WhatsApp/i).closest("a")!;
    fireEvent.click(link);

    expect(trackMock).toHaveBeenCalledWith("whatsapp_hero_click");
  });

  it("CTA secundario aponta para #formulario", () => {
    render(<HeroAtendimento />);

    const link = screen.getByText(/Enviar mensagem/i).closest("a")!;
    expect(link.getAttribute("href")).toBe("#formulario");
  });
});

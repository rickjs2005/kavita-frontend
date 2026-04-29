import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import UserMenu from "@/components/ui/UserMenu";

/* =========================
   Mocks obrigatórios
========================= */

// Mock do AuthContext
const logoutMock = vi.fn();
let mockUser: any = null;

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    logout: logoutMock,
  }),
}));

// Mock do next/link: transforma em <a> simples para RTL
vi.mock("next/link", () => {
  return {
    __esModule: true,
    default: ({ href, children, ...rest }: any) => (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  };
});

describe("UserMenu (src/components/UserMenu.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
  });

  afterEach(async () => {
    // garante que efeitos (listeners) sejam limpos dentro de act
    await act(async () => {});
    cleanup();
  });

  it("quando não autenticado, renderiza link para login (positivo)", () => {
    // Arrange
    mockUser = null;

    // Act
    render(<UserMenu />);

    // Assert
    // O CTA mudou para um Link com aria-label="Entrar na conta" (icone +
    // texto "Entrar" escondido em mobile via `hidden lg:inline`).
    const link = screen.getByRole("link", { name: "Entrar na conta" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });

  it("quando autenticado, renderiza botão de menu da conta com nome do usuário", () => {
    // Arrange
    mockUser = { nome: "Rick", email: "rick@kavita.com" };

    // Act
    render(<UserMenu />);

    // Assert
    // O botao usa aria-label="Menu da conta" (texto fixo); o nome
    // aparece como conteudo visual ao lado do icone.
    const btn = screen.getByRole("button", { name: "Menu da conta" });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("aria-haspopup", "menu");
    expect(btn).toHaveAttribute("aria-expanded", "false");
    expect(btn).toHaveTextContent("Rick");
  });

  it("fallback do nome: usa 'Usuário' quando nome não existe (controle)", () => {
    // Arrange — quando user.nome esta ausente, o componente cai em
    // "Usuario" (fallback hardcoded), nao no email.
    mockUser = { email: "user@kavita.com" };

    // Act
    render(<UserMenu />);

    // Assert
    const btn = screen.getByRole("button", { name: "Menu da conta" });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent("Usuário");
  });

  it("abre e fecha o menu ao clicar no botão (positivo)", async () => {
    // Arrange
    mockUser = { nome: "Rick" };
    render(<UserMenu />);

    const btn = screen.getByRole("button", { name: "Menu da conta" });

    // Act: abre
    await act(async () => {
      fireEvent.click(btn);
    });

    // Assert: menu aberto
    expect(
      screen.getByRole("menu", { name: "Menu do usuário" }),
    ).toBeInTheDocument();
    expect(btn).toHaveAttribute("aria-expanded", "true");

    // Act: fecha
    await act(async () => {
      fireEvent.click(btn);
    });

    // Assert: menu fechado
    expect(
      screen.queryByRole("menu", { name: "Menu do usuário" }),
    ).not.toBeInTheDocument();
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("fecha o menu ao pressionar Escape (negativo)", async () => {
    // Arrange
    mockUser = { nome: "Rick" };
    render(<UserMenu />);
    const btn = screen.getByRole("button", { name: "Menu da conta" });

    await act(async () => {
      fireEvent.click(btn);
    });
    expect(
      screen.getByRole("menu", { name: "Menu do usuário" }),
    ).toBeInTheDocument();

    // Act
    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
    });

    // Assert
    expect(
      screen.queryByRole("menu", { name: "Menu do usuário" }),
    ).not.toBeInTheDocument();
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("fecha o menu ao clicar fora do container (negativo)", async () => {
    // Arrange
    mockUser = { nome: "Rick" };
    render(
      <div>
        <UserMenu />
        <button type="button">Fora</button>
      </div>,
    );

    const btn = screen.getByRole("button", { name: "Menu da conta" });

    await act(async () => {
      fireEvent.click(btn);
    });
    expect(
      screen.getByRole("menu", { name: "Menu do usuário" }),
    ).toBeInTheDocument();

    // Act: click fora (mousedown é o evento usado pelo componente)
    await act(async () => {
      fireEvent.mouseDown(screen.getByRole("button", { name: "Fora" }));
    });

    // Assert
    expect(
      screen.queryByRole("menu", { name: "Menu do usuário" }),
    ).not.toBeInTheDocument();
  });

  it("não fecha o menu ao clicar dentro do próprio menu (controle)", async () => {
    // Arrange
    mockUser = { nome: "Rick" };
    render(<UserMenu />);
    const btn = screen.getByRole("button", { name: "Menu da conta" });

    await act(async () => {
      fireEvent.click(btn);
    });
    expect(
      screen.getByRole("menu", { name: "Menu do usuário" }),
    ).toBeInTheDocument();

    // Act: mousedown dentro do menu
    await act(async () => {
      fireEvent.mouseDown(
        screen.getByRole("menu", { name: "Menu do usuário" }),
      );
    });

    // Assert: continua aberto
    expect(
      screen.getByRole("menu", { name: "Menu do usuário" }),
    ).toBeInTheDocument();
  });

  it("ao clicar em 'Meus Dados', fecha o menu (positivo)", async () => {
    // Arrange
    mockUser = { nome: "Rick" };
    render(<UserMenu />);
    const btn = screen.getByRole("button", { name: "Menu da conta" });

    await act(async () => {
      fireEvent.click(btn);
    });

    const link = screen.getByRole("menuitem", { name: "Meus Dados" });

    // Act
    await act(async () => {
      fireEvent.click(link);
    });

    // Assert
    expect(
      screen.queryByRole("menu", { name: "Menu do usuário" }),
    ).not.toBeInTheDocument();
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("ao clicar em 'Favoritos', fecha o menu (positivo)", async () => {
    // Arrange
    mockUser = { nome: "Rick" };
    render(<UserMenu />);
    const btn = screen.getByRole("button", { name: "Menu da conta" });

    await act(async () => {
      fireEvent.click(btn);
    });

    const link = screen.getByRole("menuitem", { name: "Favoritos" });

    // Act
    await act(async () => {
      fireEvent.click(link);
    });

    // Assert
    expect(
      screen.queryByRole("menu", { name: "Menu do usuário" }),
    ).not.toBeInTheDocument();
  });

  it("ao clicar em 'Meus Pedidos', fecha o menu (positivo)", async () => {
    // Arrange
    mockUser = { nome: "Rick" };
    render(<UserMenu />);
    const btn = screen.getByRole("button", { name: "Menu da conta" });

    await act(async () => {
      fireEvent.click(btn);
    });

    const link = screen.getByRole("menuitem", { name: "Meus Pedidos" });

    // Act
    await act(async () => {
      fireEvent.click(link);
    });

    // Assert
    expect(
      screen.queryByRole("menu", { name: "Menu do usuário" }),
    ).not.toBeInTheDocument();
  });

  it("ao clicar em 'Sair', chama logout e fecha o menu (positivo)", async () => {
    // Arrange
    mockUser = { nome: "Rick" };
    render(<UserMenu />);
    const btn = screen.getByRole("button", { name: "Menu da conta" });

    await act(async () => {
      fireEvent.click(btn);
    });

    const sair = screen.getByRole("menuitem", { name: "Sair" });

    // Act
    await act(async () => {
      fireEvent.click(sair);
    });

    // Assert
    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("menu", { name: "Menu do usuário" }),
    ).not.toBeInTheDocument();
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });
});

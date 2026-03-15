import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/context/AuthContext";

// Mock do client HTTP do projeto (obrigatório: nunca chamar rede real).
// AuthContext agora usa apiClient diretamente (não mais src/lib/api).
const getMock = vi.fn();
const postMock = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: (...args: any[]) => getMock(...args),
    post: (...args: any[]) => postMock(...args),
  },
}));

function Consumer() {
  const { user, loading, login, logout, refreshUser } = useAuth();

  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="userId">{user?.id ? String(user.id) : ""}</div>
      <div data-testid="userNome">{user?.nome ?? ""}</div>
      <div data-testid="userEmail">{user?.email ?? ""}</div>

      <button type="button" onClick={() => refreshUser()}>
        refresh
      </button>

      <button
        type="button"
        onClick={async () => {
          const res = await login("user@kavita.com", "123");
          (window as any).__login_res__ = res;
        }}
      >
        login
      </button>

      <button
        type="button"
        onClick={async () => {
          await logout();
        }}
      >
        logout
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
}

describe("AuthContext (AuthProvider + useAuth)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).__login_res__ = undefined;
  });

  it("deve lançar erro se useAuth for usado fora do Provider (negativo)", () => {
    function BadConsumer() {
      useAuth();
      return null;
    }

    expect(() => render(<BadConsumer />)).toThrow(
      "useAuth deve ser usado dentro de <AuthProvider>",
    );
  });

  it("useEffect: refreshUser deve carregar /api/users/me e setar user, e loading=false (positivo)", async () => {
    getMock.mockResolvedValueOnce({
      id: 10,
      nome: "Rick",
      email: "rick@kavita.com",
    });

    renderWithProvider();

    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(1));
    expect(getMock).toHaveBeenCalledWith("/api/users/me");

    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("false"),
    );
    expect(screen.getByTestId("userId").textContent).toBe("10");
    expect(screen.getByTestId("userNome").textContent).toBe("Rick");
    expect(screen.getByTestId("userEmail").textContent).toBe("rick@kavita.com");
  });

  it("useEffect: refreshUser falhando deve setar user=null e loading=false (negativo)", async () => {
    getMock.mockRejectedValueOnce(new Error("unauthorized"));

    renderWithProvider();

    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(1));

    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("false"),
    );
    expect(screen.getByTestId("userId").textContent).toBe("");
    expect(screen.getByTestId("userNome").textContent).toBe("");
    expect(screen.getByTestId("userEmail").textContent).toBe("");
  });

  it("login: sucesso quando backend retorna { user } válido (positivo)", async () => {
    getMock.mockRejectedValueOnce(new Error("no session")); // refreshUser

    postMock.mockResolvedValueOnce({
      user: { id: 1, nome: "Cliente", email: "cliente@kavita.com" },
    });

    renderWithProvider();
    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("login"));

    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith("/api/login", {
      email: "user@kavita.com",
      senha: "123",
    });

    await waitFor(() => {
      expect((window as any).__login_res__).toEqual({ ok: true });
    });

    expect(screen.getByTestId("userId").textContent).toBe("1");
    expect(screen.getByTestId("userNome").textContent).toBe("Cliente");
    expect(screen.getByTestId("userEmail").textContent).toBe(
      "cliente@kavita.com",
    );
  });

  it("login: sucesso quando backend retorna o user direto (sem { user }) (positivo)", async () => {
    getMock.mockRejectedValueOnce(new Error("no session")); // refreshUser

    postMock.mockResolvedValueOnce({
      id: 2,
      nome: "Direto",
      email: "direto@kavita.com",
    });

    renderWithProvider();
    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("login"));

    await waitFor(() => {
      expect((window as any).__login_res__).toEqual({ ok: true });
    });

    expect(screen.getByTestId("userId").textContent).toBe("2");
    expect(screen.getByTestId("userNome").textContent).toBe("Direto");
    expect(screen.getByTestId("userEmail").textContent).toBe(
      "direto@kavita.com",
    );
  });

  it("login: se backend não retornar user válido (sem id), deve retornar ok=false e msg 'Credenciais inválidas.' e setUser(null) (negativo)", async () => {
    getMock.mockRejectedValueOnce(new Error("no session")); // refreshUser

    postMock.mockResolvedValueOnce({ user: { nome: "SemId" } });

    renderWithProvider();
    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("login"));

    await waitFor(() => {
      expect((window as any).__login_res__).toEqual({
        ok: false,
        message: "Credenciais inválidas.",
      });
    });

    expect(screen.getByTestId("userId").textContent).toBe("");
    expect(screen.getByTestId("userNome").textContent).toBe("");
    expect(screen.getByTestId("userEmail").textContent).toBe("");
  });

  it("login: quando api lançar erro, deve retornar ok=false e msg 'Credenciais inválidas.' (negativo)", async () => {
    getMock.mockRejectedValueOnce(new Error("no session")); // refreshUser
    postMock.mockRejectedValueOnce(new Error("bad credentials")); // login

    renderWithProvider();
    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("login"));

    await waitFor(() => {
      expect((window as any).__login_res__).toEqual({
        ok: false,
        message: "Credenciais inválidas.",
      });
    });

    expect(screen.getByTestId("userId").textContent).toBe("");
  });

  it("login: deve rejeitar response com campos obrigatórios ausentes (sem nome e email) e retornar ok=false (novo comportamento — sem fallback inseguro)", async () => {
    // Este teste verifica o comportamento CORRETO após a correção de segurança:
    // antes, { id: 7 } sem email usava o email do formulário como fallback.
    // Agora, dados incompletos do backend são rejeitados (schema Zod exige email válido).
    getMock.mockRejectedValueOnce(new Error("no session")); // refreshUser

    postMock.mockResolvedValueOnce({
      user: { id: 7 }, // sem nome e sem email — shape inválido
    });

    renderWithProvider();
    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("login"));

    await waitFor(() => {
      expect((window as any).__login_res__).toEqual({
        ok: false,
        message: "Credenciais inválidas.",
      });
    });

    // Garante que o state NÃO foi populado com email do formulário
    expect(screen.getByTestId("userId").textContent).toBe("");
    expect(screen.getByTestId("userEmail").textContent).toBe("");
  });

  it("logout: deve chamar POST /api/logout e setar user=null (positivo)", async () => {
    getMock.mockResolvedValueOnce({
      id: 55,
      nome: "Logado",
      email: "logado@kavita.com",
    });

    // logout é fire-and-forget: postMock pode resolver ou rejeitar
    postMock.mockResolvedValueOnce(undefined);

    renderWithProvider();

    await waitFor(() =>
      expect(screen.getByTestId("userId").textContent).toBe("55"),
    );

    fireEvent.click(screen.getByText("logout"));

    // State local limpo imediatamente (sem esperar o backend)
    await waitFor(() =>
      expect(screen.getByTestId("userId").textContent).toBe(""),
    );

    expect(screen.getByTestId("userNome").textContent).toBe("");
    expect(screen.getByTestId("userEmail").textContent).toBe("");
  });

  it("logout: se api falhar, ainda deve setar user=null (negativo resiliente)", async () => {
    getMock.mockResolvedValueOnce({
      id: 55,
      nome: "Logado",
      email: "logado@kavita.com",
    });

    postMock.mockRejectedValueOnce(new Error("logout failed"));

    renderWithProvider();
    await waitFor(() =>
      expect(screen.getByTestId("userId").textContent).toBe("55"),
    );

    fireEvent.click(screen.getByText("logout"));

    await waitFor(() =>
      expect(screen.getByTestId("userId").textContent).toBe(""),
    );
  });

  it("refreshUser: chamado manualmente deve atualizar user (positivo)", async () => {
    getMock.mockRejectedValueOnce(new Error("no session")); // mount

    renderWithProvider();
    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("userId").textContent).toBe("");

    getMock.mockResolvedValueOnce({
      id: 77,
      nome: "Atualizado",
      email: "atualizado@kavita.com",
    });

    fireEvent.click(screen.getByText("refresh"));

    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(2));
    expect(getMock).toHaveBeenNthCalledWith(2, "/api/users/me");

    await waitFor(() =>
      expect(screen.getByTestId("userId").textContent).toBe("77"),
    );
    expect(screen.getByTestId("userNome").textContent).toBe("Atualizado");
  });
});

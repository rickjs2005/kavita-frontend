import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/context/AuthContext";

// Mock do client HTTP do projeto (obrigatório: nunca chamar rede real)
const apiMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: (...args: any[]) => apiMock(...args),
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
          // expõe resultado para asserts
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
    </AuthProvider>
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
      "useAuth deve ser usado dentro de <AuthProvider>"
    );
  });

  it("useEffect: refreshUser deve carregar /api/users/me e setar user, e loading=false (positivo)", async () => {
    // Arrange
    apiMock.mockResolvedValueOnce({
      id: 10,
      nome: "Rick",
      email: "rick@kavita.com",
    });

    // Act
    renderWithProvider();

    // Assert
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1));
    expect(apiMock).toHaveBeenCalledWith("/api/users/me");

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("userId").textContent).toBe("10");
    expect(screen.getByTestId("userNome").textContent).toBe("Rick");
    expect(screen.getByTestId("userEmail").textContent).toBe("rick@kavita.com");
  });

  it("useEffect: refreshUser falhando deve setar user=null e loading=false (negativo)", async () => {
    // Arrange
    apiMock.mockRejectedValueOnce(new Error("unauthorized"));

    // Act
    renderWithProvider();

    // Assert
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1));
    expect(apiMock).toHaveBeenCalledWith("/api/users/me");

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("userId").textContent).toBe("");
    expect(screen.getByTestId("userNome").textContent).toBe("");
    expect(screen.getByTestId("userEmail").textContent).toBe("");
  });

  it("login: sucesso quando backend retorna { user } válido (positivo)", async () => {
    // Arrange: primeiro refreshUser do mount falha silencioso para não interferir
    apiMock.mockRejectedValueOnce(new Error("no session"));

    // login retorna { user: ... }
    apiMock.mockResolvedValueOnce({
      user: { id: 1, nome: "Cliente", email: "cliente@kavita.com" },
    });

    renderWithProvider();
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1)); // refreshUser

    // Act
    fireEvent.click(screen.getByText("login"));

    // Assert
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(2));
    expect(apiMock).toHaveBeenNthCalledWith(
      2,
      "/api/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "user@kavita.com", senha: "123" }),
      })
    );

    await waitFor(() => {
      expect((window as any).__login_res__).toEqual({ ok: true });
    });

    expect(screen.getByTestId("userId").textContent).toBe("1");
    expect(screen.getByTestId("userNome").textContent).toBe("Cliente");
    expect(screen.getByTestId("userEmail").textContent).toBe("cliente@kavita.com");
  });

  it("login: sucesso quando backend retorna o user direto (sem { user }) (positivo)", async () => {
    // Arrange
    apiMock.mockRejectedValueOnce(new Error("no session")); // refreshUser

    apiMock.mockResolvedValueOnce({
      id: 2,
      nome: "Direto",
      email: "direto@kavita.com",
    });

    renderWithProvider();
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1));

    // Act
    fireEvent.click(screen.getByText("login"));

    // Assert
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(2));
    await waitFor(() => {
      expect((window as any).__login_res__).toEqual({ ok: true });
    });

    expect(screen.getByTestId("userId").textContent).toBe("2");
    expect(screen.getByTestId("userNome").textContent).toBe("Direto");
    expect(screen.getByTestId("userEmail").textContent).toBe("direto@kavita.com");
  });

  it("login: se backend não retornar user válido (sem id), deve retornar ok=false e msg 'Credenciais inválidas.' e setUser(null) (negativo)", async () => {
    // Arrange
    apiMock.mockRejectedValueOnce(new Error("no session")); // refreshUser

    // login retorna algo sem id
    apiMock.mockResolvedValueOnce({ user: { nome: "SemId" } });

    renderWithProvider();
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1));

    // Act
    fireEvent.click(screen.getByText("login"));

    // Assert
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(2));
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
    // Arrange
    apiMock.mockRejectedValueOnce(new Error("no session")); // refreshUser
    apiMock.mockRejectedValueOnce(new Error("bad credentials")); // login

    renderWithProvider();
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1));

    // Act
    fireEvent.click(screen.getByText("login"));

    // Assert
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(2));
    await waitFor(() => {
      expect((window as any).__login_res__).toEqual({
        ok: false,
        message: "Credenciais inválidas.",
      });
    });

    expect(screen.getByTestId("userId").textContent).toBe("");
  });

  it("login: deve preencher defaults (nome vazio e email fallback) quando retornos vierem incompletos (positivo)", async () => {
    // Arrange
    apiMock.mockRejectedValueOnce(new Error("no session")); // refreshUser

    apiMock.mockResolvedValueOnce({
      user: { id: 7 }, // sem nome e sem email
    });

    renderWithProvider();
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1));

    // Act
    fireEvent.click(screen.getByText("login"));

    // Assert
    await waitFor(() => {
      expect((window as any).__login_res__).toEqual({ ok: true });
    });

    expect(screen.getByTestId("userId").textContent).toBe("7");
    expect(screen.getByTestId("userNome").textContent).toBe("");
    // fallback para o email enviado no login
    expect(screen.getByTestId("userEmail").textContent).toBe("user@kavita.com");
  });

  it("logout: deve chamar POST /api/logout e setar user=null (positivo)", async () => {
    // Arrange: mount refreshUser ok setando user inicialmente
    apiMock.mockResolvedValueOnce({
      id: 55,
      nome: "Logado",
      email: "logado@kavita.com",
    });

    // logout ok
    apiMock.mockResolvedValueOnce(undefined);

    renderWithProvider();

    await waitFor(() => expect(screen.getByTestId("userId").textContent).toBe("55"));

    // Act
    fireEvent.click(screen.getByText("logout"));

    // Assert
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(2));
    expect(apiMock).toHaveBeenNthCalledWith(2, "/api/logout", { method: "POST" });

    expect(screen.getByTestId("userId").textContent).toBe("");
    expect(screen.getByTestId("userNome").textContent).toBe("");
    expect(screen.getByTestId("userEmail").textContent).toBe("");
  });

  it("logout: se api falhar, ainda deve setar user=null (negativo resiliente)", async () => {
    // Arrange: mount refreshUser ok
    apiMock.mockResolvedValueOnce({
      id: 55,
      nome: "Logado",
      email: "logado@kavita.com",
    });

    apiMock.mockRejectedValueOnce(new Error("logout failed"));

    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId("userId").textContent).toBe("55"));

    // Act
    fireEvent.click(screen.getByText("logout"));

    // Assert
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(2));
    expect(apiMock).toHaveBeenNthCalledWith(2, "/api/logout", { method: "POST" });

    expect(screen.getByTestId("userId").textContent).toBe("");
  });

  it("refreshUser: chamado manualmente deve atualizar user (positivo)", async () => {
    // Arrange: mount refreshUser falha primeiro
    apiMock.mockRejectedValueOnce(new Error("no session"));

    renderWithProvider();
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("userId").textContent).toBe("");

    // Agora refreshUser manual retorna user
    apiMock.mockResolvedValueOnce({
      id: 77,
      nome: "Atualizado",
      email: "atualizado@kavita.com",
    });

    // Act
    fireEvent.click(screen.getByText("refresh"));

    // Assert
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(2));
    expect(apiMock).toHaveBeenNthCalledWith(2, "/api/users/me");

    await waitFor(() => expect(screen.getByTestId("userId").textContent).toBe("77"));
    expect(screen.getByTestId("userNome").textContent).toBe("Atualizado");
  });
});

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

/* ------------------------------------------------------------------ */
/* Mocks                                                              */
/* ------------------------------------------------------------------ */

// next/link → <a>
vi.mock("next/link", () => ({
    __esModule: true,
    default: ({
        href,
        children,
        ...props
    }: {
        href: string;
        children: React.ReactNode;
        [key: string]: any;
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

/* ------------------------------------------------------------------ */

import MainNavCategories from "@/components/layout/MainNavCategories";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function mockFetchOnce(data: any, ok = true, status = 200) {
    (global.fetch as any).mockResolvedValueOnce({
        ok,
        status,
        json: async () => data,
    });
}

describe("MainNavCategories (src/components/MainNavCategories.tsx)", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("não renderiza nada enquanto carrega e não há categorias (controle)", async () => {
        // Arrange
        mockFetchOnce([]);

        const { container } = render(<MainNavCategories />);

        // Assert (antes do fetch resolver)
        expect(container.firstChild).toBeNull();

        // Aguarda resolução do efeito
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        // Continua não renderizando pois lista está vazia
        expect(container.firstChild).toBeNull();
    });

    it("renderiza categorias ativas vindas da API (positivo)", async () => {
        // Arrange
        mockFetchOnce([
            { id: 1, name: "Medicamentos", slug: "medicamentos", is_active: 1 },
            { id: 2, name: "Pets", slug: "pets", is_active: true },
            { id: 3, name: "Inativos", slug: "inativos", is_active: 0 },
        ]);

        render(<MainNavCategories />);

        // Act / Assert
        await waitFor(() => {
            expect(
                screen.getByRole("link", { name: "Medicamentos" })
            ).toBeInTheDocument();
        });

        expect(screen.getByRole("link", { name: "Pets" })).toBeInTheDocument();

        // Categoria inativa NÃO deve aparecer
        expect(
            screen.queryByRole("link", { name: "Inativos" })
        ).not.toBeInTheDocument();
    });

    it("aceita resposta no formato { categorias: [] } (positivo)", async () => {
        // Arrange
        mockFetchOnce({
            categorias: [
                { id: 10, name: "Fertilizantes", slug: "fertilizantes" },
            ],
        });

        render(<MainNavCategories />);

        // Assert
        await waitFor(() => {
            expect(
                screen.getByRole("link", { name: "Fertilizantes" })
            ).toBeInTheDocument();
        });

        expect(
            screen.getByRole("link", { name: "Fertilizantes" })
        ).toHaveAttribute("href", "/categorias/fertilizantes");
    });

    it("renderiza links fixos 'Serviços' e 'Kavita Drone' quando o menu é exibido (positivo)", async () => {
        // Arrange: precisa haver pelo menos 1 categoria para o componente renderizar
        mockFetchOnce([
            { id: 1, name: "Medicamentos", slug: "medicamentos", is_active: 1 },
        ]);

        render(<MainNavCategories />);

        // Act: aguarda o menu aparecer
        await waitFor(() => {
            expect(
                screen.getByRole("link", { name: "Medicamentos" })
            ).toBeInTheDocument();
        });

        // Assert: links fixos existem quando o componente está visível
        expect(screen.getByRole("link", { name: "Serviços" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Kavita Drone" })).toBeInTheDocument();

        expect(screen.getByRole("link", { name: "Serviços" })).toHaveAttribute(
            "href",
            "/servicos"
        );
        expect(screen.getByRole("link", { name: "Kavita Drone" })).toHaveAttribute(
            "href",
            "/drones"
        );
    });

    it("não renderiza nada quando a API retorna erro (negativo)", async () => {
        // Arrange
        (global.fetch as any).mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({}),
        });

        const consoleSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => { });

        const { container } = render(<MainNavCategories />);

        // Act
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        // Assert
        expect(container.firstChild).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it("filtra corretamente quando is_active não existe (controle)", async () => {
        // Arrange
        mockFetchOnce([
            { id: 1, name: "Agricultura", slug: "agricultura" },
        ]);

        render(<MainNavCategories />);

        // Assert
        await waitFor(() => {
            expect(
                screen.getByRole("link", { name: "Agricultura" })
            ).toBeInTheDocument();
        });
    });

    it("chama fetch com a URL pública correta e cache no-store (controle)", async () => {
        // Arrange
        mockFetchOnce([]);

        render(<MainNavCategories />);

        // Act
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });

        // Assert
        const call = (global.fetch as any).mock.calls[0];
        expect(call[0]).toContain("/api/public/categorias");
        expect(call[1]).toMatchObject({ cache: "no-store" });
    });
});

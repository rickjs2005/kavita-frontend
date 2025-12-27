import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";

import ProdutoForm from "@/components/admin/produtos/produtoform";

const mockFetch = vi.fn();

beforeEach(() => {
    global.fetch = mockFetch as any;
    mockFetch.mockReset();
});

function getNomeInput() {
    return screen.getByPlaceholderText(/ração premium/i);
}

function getPrecoInput() {
    return screen.getByPlaceholderText(/200,00/i);
}

function getQuantidadeInput() {
    return screen.getByDisplayValue("") as HTMLInputElement
        || screen.getAllByRole("textbox").find(
            (el) => el.getAttribute("inputmode") === "numeric"
        )!;
}

describe("ProdutoForm", () => {
    it("renderiza campos básicos do formulário (positivo)", () => {
        render(<ProdutoForm />);

        expect(getNomeInput()).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(getPrecoInput()).toBeInTheDocument();

        const qtyInput = screen.getAllByRole("textbox").find(
            (el) => el.getAttribute("inputmode") === "numeric"
        );
        expect(qtyInput).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: /adicionar produto/i })
        ).toBeInTheDocument();
    });

    it("valida categoria obrigatória (negativo)", async () => {
        render(<ProdutoForm />);

        await act(async () => {
            fireEvent.change(getNomeInput(), {
                target: { value: "Produto X" },
            });

            fireEvent.change(getPrecoInput(), {
                target: { value: "10" },
            });

            const qtyInput = screen.getAllByRole("textbox").find(
                (el) => el.getAttribute("inputmode") === "numeric"
            )!;
            fireEvent.change(qtyInput, { target: { value: "1" } });

            fireEvent.click(
                screen.getByRole("button", { name: /adicionar produto/i })
            );
        });

        expect(
            await screen.findByText(/selecione/i)
        ).toBeInTheDocument();
    });

    it("submete formulário corretamente (POST) (positivo)", async () => {
        mockFetch
            // 1️⃣ categorias
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [{ id: 1, name: "Rações" }],
            })
            // 2️⃣ submit
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            });

        const onProdutoAdicionado = vi.fn();

        render(<ProdutoForm onProdutoAdicionado={onProdutoAdicionado} />);

        // ⏳ aguarda categoria aparecer
        const categoriaSelect = await screen.findByRole("combobox");

        await act(async () => {
            fireEvent.change(
                screen.getByPlaceholderText(/ração premium/i),
                { target: { value: "Produto Teste" } }
            );

            fireEvent.change(categoriaSelect, {
                target: { value: "1" },
            });

            fireEvent.change(
                screen.getByPlaceholderText(/200,00/i),
                { target: { value: "25" } }
            );

            const qtyInput = screen
                .getAllByRole("textbox")
                .find(el => el.getAttribute("inputmode") === "numeric")!;

            fireEvent.change(qtyInput, { target: { value: "5" } });

            fireEvent.click(
                screen.getByRole("button", { name: /adicionar produto/i })
            );
        });

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(onProdutoAdicionado).toHaveBeenCalledTimes(1);
        });
    });
});
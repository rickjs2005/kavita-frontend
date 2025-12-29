// src/__tests__/components/SearchInput.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, act } from "@testing-library/react";

import SearchInputProdutos from "../../components/products/SearchInput";
import { mockGlobalFetch, flushMicrotasks } from "../testUtils";

type FetchResponseLike = {
    ok: boolean;
    status: number;
    json: () => Promise<any>;
    text: () => Promise<string>;
};

function mockFetchOnceJson(payload: any, init?: { ok?: boolean; status?: number }) {
    const ok = init?.ok ?? true;
    const status = init?.status ?? (ok ? 200 : 500);

    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({
        ok,
        status,
        json: vi.fn().mockResolvedValue(payload),
        text: vi.fn().mockResolvedValue(typeof payload === "string" ? payload : JSON.stringify(payload)),
    } satisfies FetchResponseLike);
}

function createDeferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

async function focusInput(input: HTMLInputElement) {
    await act(async () => {
        fireEvent.focus(input);
        await flushMicrotasks();
    });
}

async function changeValue(input: HTMLInputElement, value: string) {
    await act(async () => {
        fireEvent.change(input, { target: { value } });
        await flushMicrotasks();
    });
}

async function advance(ms: number) {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
        await flushMicrotasks();
    });
}

describe("SearchInputProdutos (src/components/SearchInput.tsx)", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.spyOn(console, "warn").mockImplementation(() => { });
        mockGlobalFetch();
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    function setup(props?: Partial<React.ComponentProps<typeof SearchInputProdutos>>) {
        const onPick = vi.fn();
        const apiBase = "http://api.test";

        render(
            <SearchInputProdutos
                onPick={onPick}
                apiBase={apiBase}
                placeholder="Buscar produto…"
                {...props}
            />
        );

        const input = screen.getByPlaceholderText("Buscar produto…") as HTMLInputElement;
        return { onPick, apiBase, input };
    }

    it("carrega produtos via fetch (sucesso) e filtra por termo com debounce, renderizando resultados", async () => {
        // Arrange
        mockFetchOnceJson({
            data: [
                { id: 1, name: "Ivermectina", price: 12.5, image: "ivm.png" },
                { id: 2, name: "Vitamina B12", price: 0, image: "http://cdn.test/b12.png" },
            ],
        });

        const { input, apiBase } = setup();

        // Act
        await focusInput(input); // abre dropdown + deixa useEffect do fetch “commitar”
        await changeValue(input, "iver");
        await advance(300); // debounce

        // Assert
        const list = screen.getByRole("list");
        expect(within(list).getByText("Ivermectina")).toBeInTheDocument();

        const img1 = within(list).getByRole("img", { name: "Ivermectina" }) as HTMLImageElement;
        expect(img1.src).toBe(`${apiBase}/uploads/ivm.png`);

        const img2 = within(list).getByRole("img", { name: "Vitamina B12" }) as HTMLImageElement;
        expect(img2.src).toContain("http://cdn.test/b12.png");
    });

    it("ao clicar em um item (onMouseDown) chama onPick, fecha dropdown e limpa input", async () => {
        // Arrange
        mockFetchOnceJson({
            products: [{ id: 10, name: "Ração Premium", price: 99.9, image: "uploads/racao.jpg" }],
        });

        const { input, onPick } = setup();

        // Act
        await focusInput(input);
        await changeValue(input, "ração");
        await advance(300);

        const list = screen.getByRole("list");
        const li = within(list).getByText("Ração Premium").closest("li");
        expect(li).toBeTruthy();

        await act(async () => {
            fireEvent.mouseDown(li!);
            await flushMicrotasks();
        });

        // Assert
        expect(onPick).toHaveBeenCalledTimes(1);
        expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: 10, name: "Ração Premium" }));

        expect(screen.queryByRole("list")).not.toBeInTheDocument();
        expect((screen.getByPlaceholderText("Buscar produto…") as HTMLInputElement).value).toBe("");
    });

    it("navegação por teclado: ArrowDown move cursor e Enter não seleciona automaticamente (não chama onPick)", async () => {
        // Arrange
        mockFetchOnceJson({
            rows: [
                { id: 1, name: "Cálcio", price: 10, image: "calc.png" },
                { id: 2, name: "Cálcio Plus", price: 20, image: "calc-plus.png" },
            ],
        });

        const { input, onPick } = setup();

        // Act
        await focusInput(input);
        await changeValue(input, "cál");
        await advance(300);

        await act(async () => {
            fireEvent.keyDown(input, { key: "ArrowDown" });
            fireEvent.keyDown(input, { key: "Enter" });
            await flushMicrotasks();
        });

        // Assert (comportamento observado no componente: Enter não aciona pick)
        expect(onPick).not.toHaveBeenCalled();

        // E a lista continua visível (teclado não “fecha” nem seleciona)
        expect(screen.getByRole("list")).toBeInTheDocument();
        expect(screen.getByText("Cálcio")).toBeInTheDocument();
    });
    it("não chama onPick ao pressionar Enter com cursor = -1 (mesmo com resultados)", async () => {
        // Arrange
        mockFetchOnceJson({
            data: [{ id: 7, name: "Antibiótico X", price: 30, image: "a.png" }],
        });

        const { input, onPick } = setup();

        // Act
        await focusInput(input);
        await changeValue(input, "anti");
        await advance(300);

        await act(async () => {
            fireEvent.keyDown(input, { key: "Enter" });
            await flushMicrotasks();
        });

        // Assert
        expect(onPick).not.toHaveBeenCalled();
        expect(screen.getByRole("list")).toBeInTheDocument();
    });

    it("estado de loading: enquanto fetch está pendente, mostra 'Carregando…' quando aberto", async () => {
        // Arrange
        const deferred = createDeferred<FetchResponseLike>();
        const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
        fetchMock.mockReturnValueOnce(deferred.promise);

        const { input } = setup();

        // Act
        await focusInput(input);

        // Assert
        expect(screen.getByRole("list")).toBeInTheDocument();
        expect(screen.getByText("Carregando…")).toBeInTheDocument();

        // encerra promise pra não vazar
        deferred.resolve({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue({ data: [] }),
            text: vi.fn().mockResolvedValue(""),
        });

        await act(async () => {
            await flushMicrotasks();
        });
    });

    it("falha no fetch: não quebra UI e quando há termo mostra 'Nenhum produto encontrado'", async () => {
        // Arrange
        const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: vi.fn().mockResolvedValue({}),
            text: vi.fn().mockResolvedValue("Erro interno"),
        } satisfies FetchResponseLike);

        const { input } = setup();

        // Act
        await focusInput(input);
        await changeValue(input, "qualquer");
        await advance(300);

        // Assert
        expect(screen.getByRole("list")).toBeInTheDocument();
        expect(screen.getByText("Nenhum produto encontrado")).toBeInTheDocument();
    });

    it("quando aberto e sem termo (após debounce), mostra 'Digite para buscar…'", async () => {
        // Arrange
        mockFetchOnceJson({ data: [] });

        const { input } = setup();

        // Act
        await focusInput(input);
        await advance(300);

        // Assert
        expect(screen.getByRole("list")).toBeInTheDocument();
        expect(screen.getByText("Digite para buscar…")).toBeInTheDocument();
    });

    it("onBlur fecha dropdown após 150ms (estável com fake timers)", async () => {
        // Arrange
        mockFetchOnceJson({ data: [] });

        const { input } = setup();

        // Act
        await focusInput(input);
        expect(screen.getByRole("list")).toBeInTheDocument();

        await act(async () => {
            fireEvent.blur(input);
            await flushMicrotasks();
        });

        // Assert: antes de 150ms ainda aberto
        await advance(149);
        expect(screen.getByRole("list")).toBeInTheDocument();

        // Assert: em 150ms fecha
        await advance(1);
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });
});

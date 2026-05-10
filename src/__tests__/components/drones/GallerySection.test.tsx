import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import GallerySection from "@/components/drones/GallerySection";
import type { DroneGalleryItem } from "@/types/drones";

// Mock absUrl so URLs are predictable in tests
vi.mock("@/utils/absUrl", () => ({
  absUrl: (raw: string | null | undefined) =>
    raw ? `http://localhost:5000/uploads/${raw}` : "/images/placeholder.png",
  PLACEHOLDER_IMAGE: "/images/placeholder.png",
}));

// Mock next/image — devolve <img> com src direto. O componente real
// reescreve src para /_next/image?url=... no runtime, o que quebraria
// asserts de src no jsdom.
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, fill: _fill, priority: _priority, quality: _quality, sizes: _sizes, ...rest }: any) => {
    const resolvedSrc = typeof src === "string" ? src : src?.src ?? "";
    return <img src={resolvedSrc} alt={alt} {...rest} />;
  },
}));

function makeItem(
  overrides: Partial<DroneGalleryItem> & { id: number },
): DroneGalleryItem {
  return {
    media_type: "IMAGE",
    media_path: `drones/img-${overrides.id}.jpg`,
    caption: null,
    sort_order: overrides.id,
    is_active: 1,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("GallerySection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders gallery heading", () => {
    render(<GallerySection items={[]} />);
    expect(screen.getByText("Galeria")).toBeInTheDocument();
  });

  it("shows empty state when items list is empty", () => {
    render(<GallerySection items={[]} />);
    expect(
      screen.getByText("Nenhum item na galeria ainda."),
    ).toBeInTheDocument();
  });

  it("renders gallery images with correct src and alt attributes", () => {
    const items = [makeItem({ id: 1, caption: "Foto 1" })];
    render(<GallerySection items={items} />);

    const img = screen.getByAltText("Foto 1") as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toBe(
      "http://localhost:5000/uploads/drones/img-1.jpg",
    );
  });

  it("renders gallery image with fallback alt when caption is null", () => {
    const items = [makeItem({ id: 1, caption: null })];
    render(<GallerySection items={items} />);

    const img = screen.getByAltText("Galeria") as HTMLImageElement;
    expect(img).toBeInTheDocument();
  });

  // ─── Notas de evolução do componente ────────────────────────────────────
  //
  // GallerySection foi reescrita em layout masonry (CSS columns) com
  // lightbox. Mudanças de UI relevantes que invalidaram testes antigos:
  //
  // 1. Item de imagem deixou de viver dentro de container `.aspect-video`.
  //    Apenas vídeos usam `aspect-video` — a imagem agora respeita a
  //    proporção natural via `<Image width=800 height=600 className="h-auto">`
  //    pra preservar variação retrato/paisagem do masonry.
  //
  // 2. Não há mais fallback "Imagem indisponível" no card. O componente
  //    delega o erro para o navegador/next-image. Decisão de produto.
  //
  // 3. Não há mais "MediaBlock" hero dedicado. O heroItemId apenas adiciona
  //    badge "Destaque" no canto, sem mudar layout. Antes era um bloco
  //    grande separado da grade.
  //
  // 4. Caption null não renderiza "Sem legenda" — caption só aparece em
  //    hover overlay quando presente. Ausência de caption = nada visível.
  //
  // 5. Badges são Title Case ("Destaque", "Card") — antes eram CAPS LOCK.
  //
  // Testes abaixo refletem a UI atual.

  it("renderiza imagem com layout break-inside-avoid (masonry)", () => {
    // O layout masonry usa `columns-*` no contêiner pai e cada card
    // tem `break-inside-avoid` pra não quebrar entre colunas. Validar
    // estrutura via classe CSS é o mais próximo de "renderizou no
    // masonry correto" sem testar layout pixel-perfect (não-determinístico
    // em jsdom).
    const items = [makeItem({ id: 1 })];
    const { container } = render(<GallerySection items={items} />);

    const img = screen.getByAltText("Galeria") as HTMLImageElement;
    expect(img).toBeInTheDocument();

    const card = container.querySelector(".break-inside-avoid");
    expect(card).toBeInTheDocument();
  });

  it("renders hero badge ('Destaque') on item matching heroItemId", () => {
    const items = [makeItem({ id: 5 }), makeItem({ id: 6 })];
    render(<GallerySection items={items} heroItemId={5} />);

    // Badge mudou de "DESTAQUE" para "Destaque" (Title Case) na refatoração
    // editorial da landing.
    expect(screen.getByText("Destaque")).toBeInTheDocument();
  });

  it("renders card badge ('Card') on item matching cardItemId", () => {
    const items = [makeItem({ id: 5 }), makeItem({ id: 6 })];
    render(<GallerySection items={items} cardItemId={6} />);

    expect(screen.getByText("Card")).toBeInTheDocument();
  });

  it("heroItemId continua exibindo a imagem do item correspondente", () => {
    // Antes existia um "MediaBlock" separado para o hero. Agora o
    // heroItemId só adiciona o badge "Destaque" — a imagem segue na
    // grade como qualquer outro card. Validamos que a imagem do item
    // marcado segue presente.
    const items = [makeItem({ id: 3, caption: "Hero caption" })];
    render(<GallerySection items={items} heroItemId={3} />);

    expect(screen.getByAltText("Hero caption")).toBeInTheDocument();
    expect(screen.getByText("Destaque")).toBeInTheDocument();
  });

  it("renders video element for VIDEO media type", () => {
    const items = [makeItem({ id: 7, media_type: "VIDEO" })];
    const { container } = render(<GallerySection items={items} />);

    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video).toBeInTheDocument();
    expect(video.getAttribute("src")).toBe(
      "http://localhost:5000/uploads/drones/img-7.jpg",
    );
  });

  it("vídeo continua dentro de container .aspect-video (proporção fixa)", () => {
    // Apenas vídeos usam aspect-video no novo layout. Imagens herdam
    // proporção natural via masonry. Esse teste preserva a invariante
    // "vídeo tem aspect 16:9" no card da galeria.
    const items = [makeItem({ id: 7, media_type: "VIDEO" })];
    const { container } = render(<GallerySection items={items} />);

    const wrapper = container.querySelector(".aspect-video");
    expect(wrapper).toBeInTheDocument();
  });

  it("renders caption text when provided (hover overlay)", () => {
    // Caption renderiza no overlay com opacity-0 → opacity-100 no group-hover.
    // O texto está no DOM o tempo todo (só visualmente oculto), então
    // queryByText encontra normalmente.
    const items = [makeItem({ id: 1, caption: "Uma ótima foto" })];
    render(<GallerySection items={items} />);
    expect(screen.getAllByText("Uma ótima foto").length).toBeGreaterThan(0);
  });

  it("não renderiza 'Sem legenda' quando caption é null (overlay omitido)", () => {
    // A UI atual não exibe placeholder de caption — quando null, simplesmente
    // não renderiza o overlay de legenda. Validar a ausência protege contra
    // regressão em que o placeholder volte sem decisão de produto.
    const items = [makeItem({ id: 1, caption: null })];
    render(<GallerySection items={items} />);
    expect(screen.queryByText("Sem legenda")).not.toBeInTheDocument();
  });

  it("clicar em card abre lightbox (dialog)", () => {
    // Comportamento novo da v3: card é <button> que abre lightbox.
    // Validar que a interação semântica funciona substitui os testes
    // antigos de fallback de imagem (que não existem mais).
    const items = [makeItem({ id: 1, caption: "Foto 1" })];
    render(<GallerySection items={items} />);

    const card = screen.getByRole("button", { name: "Foto 1" });
    fireEvent.click(card);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

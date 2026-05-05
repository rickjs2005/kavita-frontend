import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import GallerySection from "@/components/drones/GallerySection";
import type { DroneGalleryItem } from "@/types/drones";

// Mock absUrl so URLs are predictable in tests
vi.mock("@/utils/absUrl", () => ({
  absUrl: (raw: string | null | undefined) =>
    raw ? `http://localhost:5000/uploads/${raw}` : "/placeholder.png",
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

  it("gallery image fica dentro de container com aspect-video", () => {
    // Apos a migracao para next/image fill, width/height/loading nao
    // sao mais atributos diretos do <img> — o tamanho vem do container
    // (className aspect-video). Validamos isso em vez dos atributos
    // antigos.
    const items = [makeItem({ id: 1 })];
    const { container } = render(<GallerySection items={items} />);

    const img = screen.getByAltText("Galeria") as HTMLImageElement;
    expect(img).toBeInTheDocument();

    const wrapper = container.querySelector(".aspect-video");
    expect(wrapper).toBeInTheDocument();
  });

  it("shows error fallback when gallery image fails to load", () => {
    const items = [makeItem({ id: 1 })];
    render(<GallerySection items={items} />);

    const img = screen.getByAltText("Galeria") as HTMLImageElement;
    fireEvent.error(img);

    expect(screen.queryByAltText("Galeria")).not.toBeInTheDocument();
    expect(screen.getByText("Imagem indisponível")).toBeInTheDocument();
  });

  it("renders hero badge on item matching heroItemId", () => {
    const items = [makeItem({ id: 5 }), makeItem({ id: 6 })];
    render(<GallerySection items={items} heroItemId={5} />);

    expect(screen.getByText("DESTAQUE")).toBeInTheDocument();
  });

  it("renders card badge on item matching cardItemId", () => {
    const items = [makeItem({ id: 5 }), makeItem({ id: 6 })];
    render(<GallerySection items={items} cardItemId={6} />);

    expect(screen.getByText("CARD")).toBeInTheDocument();
  });

  it("renders MediaBlock for heroItem com a imagem do hero", () => {
    const items = [makeItem({ id: 3, caption: "Hero caption" })];
    render(<GallerySection items={items} heroItemId={3} />);

    // Apos migrar para next/image, "loading=eager" deixa de ser atributo
    // direto. O MediaBlock segue renderizando a imagem do hero — checamos
    // pela presenca da img com a caption esperada.
    const heroImgs = screen.getAllByAltText("Hero caption") as HTMLImageElement[];
    expect(heroImgs.length).toBeGreaterThan(0);
  });

  it("renders MediaBlock title label", () => {
    const items = [makeItem({ id: 3 })];
    render(<GallerySection items={items} heroItemId={3} />);
    expect(screen.getByText("Destaque")).toBeInTheDocument();
  });

  it("MediaBlock shows error fallback when image fails to load", () => {
    const items = [makeItem({ id: 3 })];
    render(<GallerySection items={items} heroItemId={3} />);

    // O MediaBlock usa alt = caption || title = "Destaque"
    const heroImgs = screen.getAllByAltText("Destaque") as HTMLImageElement[];
    expect(heroImgs.length).toBeGreaterThan(0);

    fireEvent.error(heroImgs[0]);

    expect(screen.getByText("Imagem indisponível")).toBeInTheDocument();
  });

  it("MediaBlock renderiza imagem dentro de container aspect-video", () => {
    // Apos migrar para next/image fill, width/height nao sao mais
    // atributos diretos. O container .aspect-video define o tamanho.
    const items = [makeItem({ id: 3 })];
    const { container } = render(<GallerySection items={items} heroItemId={3} />);

    const heroImgs = screen.getAllByAltText("Destaque") as HTMLImageElement[];
    expect(heroImgs.length).toBeGreaterThan(0);

    const wrapper = container.querySelector(".aspect-video");
    expect(wrapper).toBeInTheDocument();
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

  it("renders caption text when provided", () => {
    const items = [makeItem({ id: 1, caption: "Uma ótima foto" })];
    render(<GallerySection items={items} />);
    expect(screen.getAllByText("Uma ótima foto").length).toBeGreaterThan(0);
  });

  it("renders 'Sem legenda' when caption is null", () => {
    const items = [makeItem({ id: 1, caption: null })];
    render(<GallerySection items={items} />);
    expect(screen.getAllByText("Sem legenda").length).toBeGreaterThan(0);
  });
});

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// mock next/link
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import HeroSection from "@/components/layout/HeroSection";

type FetchMock = ReturnType<typeof vi.fn>;

function mockFetchOk(payload: any) {
  const fetchMock = global.fetch as unknown as FetchMock;

  fetchMock.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => payload,
  } as any);
}

function mockFetchNotOk() {
  const fetchMock = global.fetch as unknown as FetchMock;

  fetchMock.mockResolvedValueOnce({
    ok: false,
    status: 500,
    json: async () => ({}),
  } as any);
}

describe("HeroSection (layout/HeroSection.tsx)", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...OLD_ENV };
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:5000";
    global.fetch = vi.fn() as any;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("renderiza o vídeo quando backend retorna hero_video_url", async () => {
    mockFetchOk({
      hero_video_url: "https://cdn.site.com/hero.mp4",
      hero_image_url: "https://cdn.site.com/hero.jpg",
      button_label: "Ver drones",
      button_href: "/drones",
      title: "Meu título",
      subtitle: "Meu subtítulo",
    });

    render(<HeroSection />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const video = document.querySelector("video");
    expect(video).toBeTruthy();
    expect(video?.getAttribute("src")).toBe("https://cdn.site.com/hero.mp4");

    expect(screen.getByText("Meu título")).toBeInTheDocument();
    expect(screen.getByText("Meu subtítulo")).toBeInTheDocument();

    const cta = screen.getByRole("link", { name: "Ver drones" });
    expect(cta).toHaveAttribute("href", "/drones");
  });

  it("exibe fallback de imagem quando vídeo dispara erro", async () => {
    mockFetchOk({
      hero_video_url: "https://cdn.site.com/hero.mp4",
      hero_image_url: "https://cdn.site.com/hero.jpg",
    });

    render(<HeroSection />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const video = document.querySelector("video") as HTMLVideoElement;
    expect(video).toBeTruthy();

    fireEvent.error(video);

    await waitFor(() => {
      const bg = document.querySelector(
        'div[style*="background-image"]'
      ) as HTMLDivElement | null;

      expect(bg).toBeTruthy();
      expect(bg?.getAttribute("style") || "").toContain("hero.jpg");
    });
  });

  it("mantém defaults quando backend falha", async () => {
    mockFetchNotOk();

    render(<HeroSection />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    expect(screen.getByText(/Revolucione sua/i)).toBeInTheDocument();

    const cta = screen.getByRole("link", { name: "Saiba Mais" });
    expect(cta).toHaveAttribute("href", "/drones");
  });

  it("normalizeHref: adiciona '/' quando necessário", async () => {
    mockFetchOk({
      button_label: "Ir",
      button_href: "drones",
    });

    render(<HeroSection />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const cta = screen.getByRole("link", { name: "Ir" });
    expect(cta).toHaveAttribute("href", "/drones");
  });

  it("chama fetch com endpoint correto", async () => {
    mockFetchOk({});

    render(<HeroSection />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const [url, init] = (global.fetch as any).mock.calls[0];

    expect(url).toBe("http://localhost:5000/api/public/site-hero");
    expect(init).toMatchObject({ method: "GET", cache: "no-store" });
  });
});
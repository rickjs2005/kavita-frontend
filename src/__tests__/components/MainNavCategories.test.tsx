import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Import relativo para evitar conflito de alias
import MainNavCategoriesRaw, {
  type PublicCategory,
} from "../../components/layout/MainNavCategories";

const MainNavCategories =
  MainNavCategoriesRaw as React.ComponentType<{ categories: PublicCategory[] }>;

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

describe("MainNavCategories (props-driven)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("não renderiza nada quando categories é vazio (controle)", () => {
    const { container } = render(<MainNavCategories categories={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renderiza categorias recebidas via props (positivo)", () => {
    const categories: PublicCategory[] = [
      { id: 1, name: "Medicamentos", slug: "medicamentos", is_active: 1 },
      { id: 2, name: "Pets", slug: "pets", is_active: true },
    ];

    render(<MainNavCategories categories={categories} />);

    expect(
      screen.getByRole("link", { name: "Medicamentos" })
    ).toHaveAttribute("href", "/categorias/medicamentos");

    expect(screen.getByRole("link", { name: "Pets" })).toHaveAttribute(
      "href",
      "/categorias/pets"
    );
  });

  it("renderiza links fixos 'Serviços' e 'Kavita Drone' quando há pelo menos 1 categoria (positivo)", () => {
    const categories: PublicCategory[] = [
      { id: 1, name: "Agro", slug: "agro", is_active: 1 },
    ];

    render(<MainNavCategories categories={categories} />);

    expect(screen.getByRole("link", { name: "Serviços" })).toHaveAttribute(
      "href",
      "/servicos"
    );

    expect(screen.getByRole("link", { name: "Kavita Drone" })).toHaveAttribute(
      "href",
      "/drones"
    );
  });
});

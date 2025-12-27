import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCard } from "@/components/admin/KpiCard";

describe("KpiCard", () => {
  it("renderiza label e value corretamente (positivo)", () => {
    // Arrange
    render(<KpiCard label="Pedidos" value={120} />);

    // Assert
    expect(screen.getByText("Pedidos")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("renderiza helper quando fornecido (positivo)", () => {
    // Arrange
    render(
      <KpiCard
        label="Faturamento"
        value="R$ 2.500"
        helper="Últimos 30 dias"
      />
    );

    // Assert
    expect(screen.getByText("Últimos 30 dias")).toBeInTheDocument();
  });

  it("não renderiza helper quando não fornecido (negativo)", () => {
    // Arrange
    render(<KpiCard label="Usuários" value={42} />);

    // Assert
    expect(
      screen.queryByText(/últimos/i)
    ).not.toBeInTheDocument();
  });

  it("renderiza ícone quando icon é passado (positivo)", () => {
    // Arrange
    render(
      <KpiCard
        label="Alertas"
        value={3}
        icon={<span data-testid="kpi-icon">⚠️</span>}
      />
    );

    // Assert
    expect(screen.getByTestId("kpi-icon")).toBeInTheDocument();
  });

  it("não renderiza container de ícone quando icon não é passado (negativo)", () => {
    // Arrange
    const { container } = render(
      <KpiCard label="Produtos" value={10} />
    );

    // Assert
    // Não deve existir nenhum badge de ícone
    expect(container.querySelector("[data-testid='kpi-icon']")).toBeNull();
  });

  it("aplica estilos da variante default por padrão (positivo/controle)", () => {
    // Arrange
    const { container } = render(
      <KpiCard label="Pedidos" value={99} />
    );

    // Assert
    const root = container.firstElementChild;
    expect(root?.className).toContain("border-slate-800");
    expect(root?.className).toContain("bg-slate-950");
  });

  it("aplica estilos da variante success corretamente (positivo)", () => {
    // Arrange
    const { container } = render(
      <KpiCard
        label="Pedidos Concluídos"
        value={80}
        variant="success"
      />
    );

    // Assert
    const root = container.firstElementChild;
    expect(root?.className).toContain("border-emerald-500");
    expect(root?.className).toContain("from-emerald-950");
  });

  it("aplica estilos da variante warning corretamente (positivo)", () => {
    // Arrange
    const { container } = render(
      <KpiCard
        label="Pedidos Pendentes"
        value={12}
        variant="warning"
      />
    );

    // Assert
    const root = container.firstElementChild;
    expect(root?.className).toContain("border-amber-500");
    expect(root?.className).toContain("from-amber-950");
  });

  it("aplica estilos da variante danger corretamente (positivo)", () => {
    // Arrange
    const { container } = render(
      <KpiCard
        label="Pedidos Cancelados"
        value={4}
        variant="danger"
      />
    );

    // Assert
    const root = container.firstElementChild;
    expect(root?.className).toContain("border-rose-500");
    expect(root?.className).toContain("from-rose-950");
  });

  it("aplica className customizado junto aos estilos base (positivo)", () => {
    // Arrange
    const { container } = render(
      <KpiCard
        label="Clientes"
        value={150}
        className="custom-class"
      />
    );

    // Assert
    const root = container.firstElementChild;
    expect(root?.className).toContain("custom-class");
  });

  it("renderiza value como string sem conversão indevida (controle)", () => {
    // Arrange
    render(<KpiCard label="Saldo" value="R$ 1.000,00" />);

    // Assert
    expect(screen.getByText("R$ 1.000,00")).toBeInTheDocument();
  });
});

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ProductShippingSection, { type ShippingRules } from "@/components/admin/produtos/ProductShippingSection";

type HarnessProps = {
  initial: ShippingRules;
  onChangeSpy?: (next: ShippingRules) => void;
};

function Harness({ initial, onChangeSpy }: HarnessProps) {
  const [value, setValue] = React.useState<ShippingRules>(initial);

  return (
    <ProductShippingSection
      value={value}
      onChange={(next) => {
        setValue(next);
        onChangeSpy?.(next);
      }}
    />
  );
}

const baseValue: ShippingRules = {
  shippingFree: false,
  shippingFreeFromQtyStr: "",
  shippingPrazoDiasStr: "",
};

describe("ProductShippingSection (src/components/ProductShippingSection.tsx)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza título e texto introdutório (smoke) e exibe apenas o input de prazo quando shippingFree=false", () => {
    const onChangeSpy = vi.fn();
    render(<Harness initial={baseValue} onChangeSpy={onChangeSpy} />);

    expect(screen.getByText("Frete do produto")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Configure regras simples de frete grátis por produto e o prazo específico deste item\./i
      )
    ).toBeInTheDocument();

    // Quando shippingFree=false, só existe 1 input com placeholder "Ex.: 3" (prazo).
    const inputs = screen.getAllByPlaceholderText("Ex.: 3");
    expect(inputs).toHaveLength(1);

    // Checkbox presente e desmarcado
    const checkbox = screen.getByLabelText("Frete grátis (este produto)") as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(false);

    // Não deve existir a área de "Frete grátis a partir de"
    expect(screen.queryByText(/Frete grátis a partir de/i)).not.toBeInTheDocument();
  });

  it("normaliza o prazo (dias): permite só dígitos, limita a 4 chars, e trata '0' como ''", () => {
    const onChangeSpy = vi.fn();
    render(<Harness initial={baseValue} onChangeSpy={onChangeSpy} />);

    const prazoInput = screen.getByPlaceholderText("Ex.: 3") as HTMLInputElement;

    // Digita com letras/símbolos => só números; limite 4
    fireEvent.change(prazoInput, { target: { value: "12a3-45" } });
    expect(onChangeSpy).toHaveBeenLastCalledWith({
      ...baseValue,
      shippingPrazoDiasStr: "1234", // digits: 12345 => slice(0,4) => 1234
    });
    expect(prazoInput.value).toBe("1234");

    // Digita "0" => normaliza para string vazia
    fireEvent.change(prazoInput, { target: { value: "0" } });
    expect(onChangeSpy).toHaveBeenLastCalledWith({
      ...baseValue,
      shippingPrazoDiasStr: "",
    });
    expect(prazoInput.value).toBe("");
  });

  it("ao marcar 'Frete grátis', mantém qty como está (ou vazio) e exibe o campo de quantidade", () => {
    const onChangeSpy = vi.fn();

    render(
      <Harness
        initial={{
          ...baseValue,
          shippingFree: false,
          shippingFreeFromQtyStr: "",
          shippingPrazoDiasStr: "7",
        }}
        onChangeSpy={onChangeSpy}
      />
    );

    const checkbox = screen.getByLabelText("Frete grátis (este produto)") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);

    // Quando marca, patch({ shippingFree: true }) => preserva demais campos
    expect(onChangeSpy).toHaveBeenLastCalledWith({
      shippingFree: true,
      shippingFreeFromQtyStr: "",
      shippingPrazoDiasStr: "7",
    });

    // Como estamos usando Harness controlado, a UI deve refletir e mostrar o campo de qty
    expect(screen.getByText(/Frete grátis a partir de/i)).toBeInTheDocument();

    // Agora existem 2 inputs com placeholder "Ex.: 3": prazo (1º) e qty (2º)
    const inputs = screen.getAllByPlaceholderText("Ex.: 3") as HTMLInputElement[];
    expect(inputs).toHaveLength(2);

    // Sanidade: o primeiro é prazo e deve estar com "7"
    expect(inputs[0].value).toBe("7");
  });

  it("ao desmarcar 'Frete grátis', zera qty e manda shippingFree=false (sem alterar prazo)", () => {
    const onChangeSpy = vi.fn();

    render(
      <Harness
        initial={{
          shippingFree: true,
          shippingFreeFromQtyStr: "10",
          shippingPrazoDiasStr: "3",
        }}
        onChangeSpy={onChangeSpy}
      />
    );

    // Campo de qty deve existir inicialmente
    expect(screen.getByText(/Frete grátis a partir de/i)).toBeInTheDocument();

    const checkbox = screen.getByLabelText("Frete grátis (este produto)") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);

    // Quando desmarca: onChange({ ...value, shippingFree:false, shippingFreeFromQtyStr:"" })
    expect(onChangeSpy).toHaveBeenLastCalledWith({
      shippingFree: false,
      shippingFreeFromQtyStr: "",
      shippingPrazoDiasStr: "3", // preserva prazo
    });

    // UI deve esconder detalhes após state update do Harness
    expect(screen.queryByText(/Frete grátis a partir de/i)).not.toBeInTheDocument();

    // Volta a ter só 1 input "Ex.: 3" (prazo)
    const inputs = screen.getAllByPlaceholderText("Ex.: 3");
    expect(inputs).toHaveLength(1);
    expect((inputs[0] as HTMLInputElement).value).toBe("3");
  });

  it("normaliza 'Frete grátis a partir de (unidades)': só dígitos, limita a 6 chars, trata '0' como ''", () => {
    const onChangeSpy = vi.fn();

    render(
      <Harness
        initial={{
          ...baseValue,
          shippingFree: true,
          shippingFreeFromQtyStr: "",
          shippingPrazoDiasStr: "",
        }}
        onChangeSpy={onChangeSpy}
      />
    );

    // Com shippingFree=true, há 2 inputs com placeholder "Ex.: 3": [0]=prazo, [1]=qty
    const inputs = screen.getAllByPlaceholderText("Ex.: 3") as HTMLInputElement[];
    expect(inputs).toHaveLength(2);

    const qtyInput = inputs[1];

    // Mistura chars => só números; limite 6
    fireEvent.change(qtyInput, { target: { value: "a1b2c3d4e5f6g7" } });
    expect(onChangeSpy).toHaveBeenLastCalledWith({
      shippingFree: true,
      shippingFreeFromQtyStr: "123456", // digits: 1234567 => slice(0,6)
      shippingPrazoDiasStr: "",
    });
    expect(qtyInput.value).toBe("123456");

    // "0" => ""
    fireEvent.change(qtyInput, { target: { value: "0" } });
    expect(onChangeSpy).toHaveBeenLastCalledWith({
      shippingFree: true,
      shippingFreeFromQtyStr: "",
      shippingPrazoDiasStr: "",
    });
    expect(qtyInput.value).toBe("");
  });

  it("caso negativo: não deve chamar onChangeSpy ao apenas renderizar (sem interação)", () => {
    const onChangeSpy = vi.fn();
    render(<Harness initial={baseValue} onChangeSpy={onChangeSpy} />);

    expect(onChangeSpy).not.toHaveBeenCalled();
  });
});

"use client";

import { useEffect, useState } from "react";
import { CheckoutFormChangeHandler, Endereco } from "@/hooks/useCheckoutForm";
import { ESTADOS_BR } from "@/utils/brasil";

type AddressFormProps = {
  endereco: Endereco;
  onChange: CheckoutFormChangeHandler;
};

// máscara simples 00000-000
function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function AddressForm({ endereco, onChange }: AddressFormProps) {
  const [cepLoading, setCepLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);

  const cepValue = endereco.cep ?? "";
  const estadoValue = (endereco.estado ?? "").toUpperCase();

  // CEP → ViaCEP (auto preenche rua/bairro/cidade/estado)
  useEffect(() => {
    const digits = cepValue.replace(/\D/g, "");
    if (digits.length !== 8) return;

    let aborted = false;

    (async () => {
      try {
        setCepLoading(true);
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        if (!res.ok) return;
        const data = await res.json();
        if (aborted || data.erro) return;

        onChange("endereco.logradouro", data.logradouro || "");
        onChange("endereco.bairro", data.bairro || "");
        onChange("endereco.cidade", data.localidade || "");
        onChange("endereco.estado", data.uf || "");
      } catch {
        // se falhar, o usuário ainda consegue digitar manualmente
      } finally {
        if (!aborted) setCepLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [cepValue, onChange]);

  // Estado → carrega cidades (IBGE) e usa datalist como sugestão
  useEffect(() => {
    const uf = estadoValue;
    if (!uf) {
      setCities([]);
      return;
    }

    let aborted = false;

    (async () => {
      try {
        const res = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (aborted || !Array.isArray(data)) return;

        const names = data.map((m: any) => m.nome).sort();
        setCities(names);
      } catch {
        // se falhar, deixa o usuário digitar normalmente
      }
    })();

    return () => {
      aborted = true;
    };
  }, [estadoValue]);

  const handleCepChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const masked = formatCep(e.target.value);
    onChange("endereco.cep", masked);
  };

  const handleFieldChange =
    (field: keyof Endereco): React.ChangeEventHandler<HTMLInputElement> =>
    (e) => {
      onChange(`endereco.${field}`, e.target.value);
    };

  const handleEstadoChange: React.ChangeEventHandler<HTMLSelectElement> = (
    e
  ) => {
    const value = e.target.value;
    onChange("endereco.estado", value);
    // limpamos cidade quando troca estado
    onChange("endereco.cidade", "");
  };

  const handleCidadeChange: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    onChange("endereco.cidade", e.target.value);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* CEP */}
      <div>
        <label
          htmlFor="checkout-cep"
          className="block text-sm font-medium text-gray-700"
        >
          CEP
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            id="checkout-cep"
            name="cep"
            value={cepValue}
            onChange={handleCepChange}
            autoComplete="postal-code"
            inputMode="numeric"
            placeholder="00000-000"
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-800 border border-gray-300 rounded-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition"
          />
          {cepLoading && (
            <span className="text-xs text-gray-500 whitespace-nowrap">
              Buscando CEP...
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-gray-500">
          Digite o CEP para preencher rua, bairro, cidade e estado
          automaticamente.
        </p>
      </div>

      {/* Estado + Cidade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label
            htmlFor="checkout-estado"
            className="block text-sm font-medium text-gray-700"
          >
            Estado
          </label>
          <select
            id="checkout-estado"
            value={estadoValue}
            onChange={handleEstadoChange}
            className="mt-1 w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-800 border border-gray-300 rounded-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition bg-white"
          >
            <option value="">Selecione o estado</option>
            {ESTADOS_BR.map((uf) => (
              <option key={uf.sigla} value={uf.sigla}>
                {uf.sigla} - {uf.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="checkout-cidade"
            className="block text-sm font-medium text-gray-700"
          >
            Cidade
          </label>
          <input
            id="checkout-cidade"
            list="checkout-cidades"
            value={endereco.cidade ?? ""}
            onChange={handleCidadeChange}
            autoComplete="address-level2"
            placeholder="Digite sua cidade"
            className="mt-1 w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-800 border border-gray-300 rounded-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition"
          />
          <datalist id="checkout-cidades">
            {cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Bairro + Número */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label
            htmlFor="checkout-bairro"
            className="block text-sm font-medium text-gray-700"
          >
            Bairro
          </label>
          <input
            id="checkout-bairro"
            value={endereco.bairro ?? ""}
            onChange={handleFieldChange("bairro")}
            placeholder="Ex.: Centro"
            className="mt-1 w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-800 border border-gray-300 rounded-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition"
          />
        </div>

        <div>
          <label
            htmlFor="checkout-numero"
            className="block text-sm font-medium text-gray-700"
          >
            Número
          </label>
          <input
            id="checkout-numero"
            value={endereco.numero ?? ""}
            onChange={handleFieldChange("numero")}
            inputMode="text"
            placeholder="Ex.: 123"
            className="mt-1 w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-800 border border-gray-300 rounded-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition"
          />
        </div>
      </div>

      {/* Rua / Avenida */}
      <div>
        <label
          htmlFor="checkout-logradouro"
          className="block text-sm font-medium text-gray-700"
        >
          Rua / Avenida
        </label>
        <input
          id="checkout-logradouro"
          value={endereco.logradouro ?? ""}
          onChange={handleFieldChange("logradouro")}
          autoComplete="street-address"
          placeholder="Ex.: Rua São José"
          className="mt-1 w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-800 border border-gray-300 rounded-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition"
        />
      </div>

      {/* Complemento / Referência */}
      <div>
        <label
          htmlFor="checkout-referencia"
          className="block text-sm font-medium text-gray-700"
        >
          Complemento / Referência
        </label>
        <input
          id="checkout-referencia"
          value={endereco.referencia ?? ""}
          onChange={handleFieldChange("referencia")}
          placeholder="Apartamento, bloco, perto de..."
          className="mt-1 w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-800 border border-gray-300 rounded-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition"
        />
      </div>
    </div>
  );
}

export default AddressForm;

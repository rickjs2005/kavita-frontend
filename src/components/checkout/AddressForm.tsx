"use client";

import { useEffect, useMemo, useState } from "react";
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

function normalizeTipoLocalidade(v: any): "URBANA" | "RURAL" {
  const t = String(v || "URBANA").toUpperCase();
  return t === "RURAL" ? "RURAL" : "URBANA";
}

export function AddressForm({ endereco, onChange }: AddressFormProps) {
  const [cepLoading, setCepLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);

  const cepValue = endereco.cep ?? "";
  const estadoValue = (endereco.estado ?? "").toUpperCase();

  const tipoLocalidade = useMemo(
    () => normalizeTipoLocalidade((endereco as any)?.tipo_localidade),
    [endereco]
  );

  const isRural = tipoLocalidade === "RURAL";

  // CEP → ViaCEP (auto preenche cidade/estado e, se URBANA, rua/bairro)
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

        // Sempre preenche cidade/estado (serve tanto urbano quanto rural)
        onChange("endereco.cidade", data.localidade || "");
        onChange("endereco.estado", data.uf || "");

        // Só preenche rua/bairro quando for URBANA
        if (!isRural) {
          onChange("endereco.logradouro", data.logradouro || "");
          onChange("endereco.bairro", data.bairro || "");
        }
      } catch {
        // se falhar, o usuário ainda consegue digitar manualmente
      } finally {
        if (!aborted) setCepLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [cepValue, onChange, isRural]);

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
    (field: keyof Endereco | string): React.ChangeEventHandler<HTMLInputElement> =>
    (e) => {
      onChange(`endereco.${field}` as any, e.target.value);
    };

  const handleEstadoChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const value = e.target.value;
    onChange("endereco.estado", value);
    // limpamos cidade quando troca estado
    onChange("endereco.cidade", "");
  };

  const handleCidadeChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange("endereco.cidade", e.target.value);
  };

  const setTipo = (tipo: "URBANA" | "RURAL") => {
    onChange("endereco.tipo_localidade" as any, tipo);

    // Quando troca para RURAL, não apagamos nada automaticamente para evitar fricção.
    // Porém, se quiser deixar “mais limpo”, pode limpar bairro/logradouro aqui.
    // Mantive conservador para não quebrar a lógica existente.
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Tipo de localidade */}
      <div>
        <span className="block text-sm font-medium text-gray-700">
          Tipo de localidade
        </span>

        <div className="mt-1 inline-flex w-full rounded-xl border border-gray-300 bg-white p-1">
          <button
            type="button"
            onClick={() => setTipo("URBANA")}
            aria-pressed={!isRural}
            className={[
              "w-1/2 rounded-lg px-3 py-2 text-sm font-medium transition min-h-[44px]",
              !isRural
                ? "bg-[#EC5B20] text-white"
                : "text-gray-700 hover:bg-gray-50",
            ].join(" ")}
          >
            Zona urbana
          </button>

          <button
            type="button"
            onClick={() => setTipo("RURAL")}
            aria-pressed={isRural}
            className={[
              "w-1/2 rounded-lg px-3 py-2 text-sm font-medium transition min-h-[44px]",
              isRural
                ? "bg-[#EC5B20] text-white"
                : "text-gray-700 hover:bg-gray-50",
            ].join(" ")}
          >
            Zona rural
          </button>
        </div>

        <p className="mt-1 text-[11px] text-gray-500">
          {isRural
            ? "Para zona rural, informe a comunidade/córrego e a descrição de acesso."
            : "Para zona urbana, informe rua/avenida, bairro e número."}
        </p>

        {/* AVISO (apenas quando RURAL) */}
        {isRural && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-sm font-semibold text-amber-900">
              Aviso importante
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-amber-900/90">
              Em área rural, podem ocorrer chuvas e estradas muito precárias. Isso
              pode dificultar nossa entrega e, eventualmente, não conseguiremos
              entregar dentro do prazo informado.
            </p>
          </div>
        )}
      </div>

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
          {isRural
            ? "Digite o CEP para sugerir cidade e estado automaticamente."
            : "Digite o CEP para preencher rua, bairro, cidade e estado automaticamente."}
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

      {/* Campos específicos de RURAL */}
      {isRural && (
        <>
          <div>
            <label
              htmlFor="checkout-comunidade"
              className="block text-sm font-medium text-gray-700"
            >
              Córrego / Comunidade
            </label>
            <input
              id="checkout-comunidade"
              value={((endereco as any)?.comunidade ?? "") as string}
              onChange={handleFieldChange("comunidade")}
              placeholder="Ex.: Córrego do Lageado, Comunidade X"
              className="mt-1 w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-800 border border-gray-300 rounded-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition"
            />
          </div>

          <div>
            <label
              htmlFor="checkout-observacoes-acesso"
              className="block text-sm font-medium text-gray-700"
            >
              Referência / Descrição de acesso
            </label>
            <input
              id="checkout-observacoes-acesso"
              value={((endereco as any)?.observacoes_acesso ?? "") as string}
              onChange={handleFieldChange("observacoes_acesso")}
              placeholder="Ex.: após a ponte, 2 km de estrada de chão, porteira azul..."
              className="mt-1 w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-800 border border-gray-300 rounded-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              Não é obrigatório informar rua/bairro na zona rural.
            </p>
          </div>
        </>
      )}

      {/* Campos de URBANA (mantém UI/fluxo atual) */}
      {!isRural && (
        <>
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
        </>
      )}

      {/* Número (também útil no rural, então mantemos sempre) */}
      {isRural && (
        <div>
          <label
            htmlFor="checkout-numero-rural"
            className="block text-sm font-medium text-gray-700"
          >
            Número (se houver)
          </label>
          <input
            id="checkout-numero-rural"
            value={endereco.numero ?? ""}
            onChange={handleFieldChange("numero")}
            inputMode="text"
            placeholder="Ex.: S/N, 123, Km 12..."
            className="mt-1 w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-800 border border-gray-300 rounded-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition"
          />
        </div>
      )}
    </div>
  );
}

export default AddressForm;

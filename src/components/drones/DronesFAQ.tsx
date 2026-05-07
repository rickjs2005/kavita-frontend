"use client";

// FAQ pública premium do módulo Kavita Drones.
// Fonte primária: GET /api/public/drones/faq.
// Fallback estático preservado abaixo se a API falhar / itens vazios.
//
// Visual: layout 2-col em desktop (cabeçalho à esquerda + accordion à
// direita) e empilhado em mobile. Accordion com transição suave e
// ícone +/- em vez de chevron rotacional.

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import type { DroneFaqItem } from "@/types/drones";

type QA = { q: string; a: string };

const FALLBACK_FAQ: QA[] = [
  {
    q: "Preciso de licença ou habilitação para operar drone agrícola?",
    a: "Sim. A operação de drones agrícolas é regulamentada pela ANAC e pelo MAPA. Existem exigências de cadastro do equipamento, certificação do piloto e acompanhamento por responsável técnico (RT) agrônomo. A Kavita orienta o caminho formal de acordo com a regulamentação vigente e conecta com profissionais habilitados quando necessário.",
  },
  {
    q: "A Kavita atende qual região do país?",
    a: "Nascemos na Zona da Mata de Minas Gerais com lojas físicas em Manhuaçu, Espera Feliz e Cachoeira do Itapemirim. A linha DJI Agras é vendida em todo o Brasil por representantes autorizados — informe sua cidade no formulário e conectamos com o representante mais próximo.",
  },
  {
    q: "Posso trabalhar prestando serviço de pulverização com drone?",
    a: "Sim, e é um dos modelos de negócio mais comuns hoje. A operação comercial requer regularização do equipamento e do piloto junto à ANAC, acompanhamento de RT agrônomo e contrato com o contratante. O T70P e o T100 são os mais usados para esse perfil.",
  },
  {
    q: "Tem treinamento incluído na compra?",
    a: "O representante combina capacitação prática na entrega do equipamento — operação básica, plano de voo, manutenção diária e troca de baterias. Certificações formais de piloto são feitas em escolas credenciadas à parte.",
  },
  {
    q: "Como faço um orçamento?",
    a: "Use o formulário abaixo ou o botão de WhatsApp no topo. Passe o tamanho da área, cultura e cidade. O representante regional devolve proposta com modelo sugerido, prazo de entrega e condição de pagamento.",
  },
  {
    q: "Qual modelo é ideal para a minha propriedade?",
    a: "T25P para até ~300 ha, terreno variado e transporte ágil. T70P para 300–800 ha, produtividade alta. T100 para acima de 800 ha, operação intensiva e prestador de serviço de grande porte. A decisão final depende de talhão, cultura e janela de aplicação — conversa com representante vale mais que tabela.",
  },
  {
    q: "O drone opera à noite e em relevo irregular?",
    a: "Sim. Sensor de radar de onda milimétrica e câmera com visão noturna mantêm altura constante em relevo acidentado e permitem janela de aplicação noturna, quando o vento é mais estável e a evaporação menor.",
  },
  {
    q: "Quanto de insumo eu economizo?",
    a: "Em média 20% a 30% de redução de calda comparado ao pulverizador terrestre, pela precisão da aplicação e pela taxa variável por mapa. O retorno em economia de defensivo costuma pagar o investimento em 1 a 2 safras.",
  },
];

function FAQItem({
  item,
  isOpen,
  onToggle,
}: {
  item: QA;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={[
        "border-b border-white/8 transition",
        isOpen ? "bg-white/[0.02]" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 py-5 text-left transition hover:text-emerald-200"
        aria-expanded={isOpen}
      >
        <span className="text-[15px] font-extrabold text-white sm:text-base">
          {item.q}
        </span>
        <span
          className={[
            "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition",
            isOpen
              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200 rotate-45"
              : "border-white/10 bg-white/[0.04] text-slate-300",
          ].join(" ")}
          aria-hidden
        >
          <Plus className="h-3.5 w-3.5" />
        </span>
      </button>
      {isOpen && (
        <div className="pb-5 pr-10 text-[14px] leading-relaxed text-slate-300/95 whitespace-pre-wrap">
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function DronesFAQ() {
  const [items, setItems] = useState<QA[]>(FALLBACK_FAQ);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get<{ items?: DroneFaqItem[] }>(
          "/api/public/drones/faq",
        );
        const list = Array.isArray(res?.items) ? res.items : [];
        if (cancelled) return;
        if (list.length) {
          setItems(list.map((it) => ({ q: it.question, a: it.answer })));
        }
      } catch {
        // Silencioso — fallback já está renderizado.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative py-16 sm:py-24">
      <div className="relative mx-auto max-w-7xl px-5">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          {/* Cabeçalho */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
              Perguntas frequentes
            </p>
            <h2 className="mt-3 text-2xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-3xl md:text-4xl lg:text-[2.6rem]">
              Antes de decidir, tire as dúvidas
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
              Reunimos as objeções mais comuns de quem está pensando em
              entrar para pulverização aérea. Sem resposta sua dúvida?
              Fale com um representante diretamente.
            </p>
            <a
              href="#drones-representatives"
              className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-extrabold text-emerald-200 transition hover:bg-emerald-500/20"
            >
              Falar com representante →
            </a>
          </div>

          {/* Accordion */}
          <div className="border-t border-white/8">
            {items.map((qa, i) => (
              <FAQItem
                key={i}
                item={qa}
                isOpen={openIdx === i}
                onToggle={() => setOpenIdx(openIdx === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

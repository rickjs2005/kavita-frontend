"use client";

// FAQ pública do módulo Kavita Drones.
// Fonte primária: GET /api/public/drones/faq (admin edita pelo painel).
// Fallback: lista estática abaixo — mantém a landing funcional se a
// API falhar ou se o admin ainda não cadastrou itens.
//
// Copy do fallback revisada: removida menção específica a "CA/CMV"
// (terminologia ANAC podia estar imprecisa em pré-lançamento).
// Texto agora aponta para regulamentação geral sem se comprometer
// com siglas específicas — admin pode publicar resposta detalhada
// pelo painel quando o RT agrônomo revisar.

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import type { DroneFaqItem } from "@/types/drones";

type QA = { q: string; a: string };

// Fallback estático — usado quando a API falha ou retorna vazio.
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

function FAQItem({ item }: { item: QA }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-emerald-400/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-[15px] font-extrabold text-white sm:text-base">
          {item.q}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-emerald-300 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      {open && (
        <div className="whitespace-pre-wrap px-5 pb-5 text-[14px] leading-relaxed text-slate-300">
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function DronesFAQ() {
  const [items, setItems] = useState<QA[]>(FALLBACK_FAQ);

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
        // Se a API retorna vazio, mantém o fallback — landing nunca fica
        // sem conteúdo de FAQ.
      } catch {
        // Silencioso — fallback estático já está renderizado.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
            Perguntas frequentes
          </p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl md:text-3xl">
            Antes de decidir, tire as dúvidas
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            As objeções mais comuns de quem está pensando em entrar para
            pulverização aérea.
          </p>
        </div>

        <div className="mt-10 grid gap-2">
          {items.map((qa, i) => (
            <FAQItem key={i} item={qa} />
          ))}
        </div>
      </div>
    </section>
  );
}

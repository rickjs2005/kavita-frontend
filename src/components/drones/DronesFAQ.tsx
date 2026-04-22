"use client";

// FAQ — perguntas frequentes de quem está pensando em comprar ou
// operar drone agrícola. Responder objeções comuns.
//
// Respostas genéricas e honestas — nada que dependa de licença real
// Kavita (ANAC/MAPA/RT) que ainda não foi publicada. Se o operador
// formalizar, trocar respostas específicas.

import { ChevronDown } from "lucide-react";
import { useState } from "react";

type QA = { q: string; a: string };

const FAQ: QA[] = [
  {
    q: "Preciso de licença ou habilitação para operar drone agrícola?",
    a: "Sim. A ANAC exige cadastro do drone e certificação do piloto (CA/CMV). O MAPA regula a aplicação de defensivos aéreos. A Kavita orienta o caminho formal e conecta com RT agrônomo quando necessário.",
  },
  {
    q: "A Kavita atende qual região do país?",
    a: "Nascemos na Zona da Mata de Minas Gerais, mas a linha DJI Agras é vendida em todo o Brasil por representantes autorizados. No formulário, informe sua cidade — conectamos com o representante mais próximo.",
  },
  {
    q: "Posso trabalhar prestando serviço de pulverização com drone?",
    a: "Sim, e é um dos modelos de negócio mais comuns hoje. Requer: CA/CMV do piloto, cadastro da empresa, RT agrônomo e contrato com o contratante. O T70P e o T100 são os mais usados para esse perfil.",
  },
  {
    q: "Tem treinamento incluído na compra?",
    a: "O representante combina capacitação prática na entrega do equipamento. Operação básica, plano de voo, manutenção diária e troca de baterias. Certificação de piloto é feita em escola credenciada à parte.",
  },
  {
    q: "Como faço um orçamento?",
    a: "Use o formulário abaixo ou o botão de WhatsApp no topo. Passe tamanho da área, cultura e cidade. O representante regional devolve proposta com modelo sugerido, prazo de entrega e condição de pagamento.",
  },
  {
    q: "Qual modelo é ideal para a minha propriedade?",
    a: "T25P para até ~300 ha, terreno variado e transporte ágil. T70P para 300–800 ha, produtividade alta. T100 para acima de 800 ha, operação intensiva e prestador de serviço de grande porte. Mas a decisão final depende de talhão, cultura e janela de aplicação — conversa com representante vale mais que tabela.",
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
        <div className="px-5 pb-5 text-[14px] leading-relaxed text-slate-300">
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function DronesFAQ() {
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
          {FAQ.map((qa, i) => (
            <FAQItem key={i} item={qa} />
          ))}
        </div>
      </div>
    </section>
  );
}

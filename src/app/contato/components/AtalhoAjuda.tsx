"use client";

import { useState } from "react";
import {
  HiOutlineTruck,
  HiOutlineArrowPath,
  HiOutlineCreditCard,
  HiOutlineShieldCheck,
  HiOutlineTag,
  HiOutlineInformationCircle,
  HiOutlineShoppingCart,
  HiOutlineLockClosed,
  HiOutlineUsers,
  HiOutlineXMark,
  HiOutlineChevronDown,
  HiOutlineShoppingBag,
} from "react-icons/hi2";
import topics from "@/data/topics";

type TopicItem = {
  title: string;
  description: string;
  content?: string[];
};

/* ── Icon + ordering config ─────────────────────────────────────── */

type TopicMeta = {
  icon: React.ComponentType<{ className?: string }>;
  priority: number; // lower = more important
};

const TOPIC_META: Record<string, TopicMeta> = {
  "Politica de Entrega": { icon: HiOutlineTruck, priority: 1 },
  "Troca e Devolucao": { icon: HiOutlineArrowPath, priority: 2 },
  "Pagamentos": { icon: HiOutlineCreditCard, priority: 3 },
  "Como Comprar": { icon: HiOutlineShoppingCart, priority: 4 },
  "Compra Segura": { icon: HiOutlineShieldCheck, priority: 5 },
  "Cupom de Desconto": { icon: HiOutlineTag, priority: 6 },
  "Produtos": { icon: HiOutlineShoppingBag, priority: 7 },
  "Privacidade e Seguranca": { icon: HiOutlineLockClosed, priority: 8 },
  "Sobre Nos": { icon: HiOutlineInformationCircle, priority: 9 },
  "Contatos de nossos colaboradores": { icon: HiOutlineUsers, priority: 10 },
};

function normalizeKey(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getMeta(title: string): TopicMeta {
  return (
    TOPIC_META[normalizeKey(title)] || {
      icon: HiOutlineInformationCircle,
      priority: 99,
    }
  );
}

/* ── Sorted topics ──────────────────────────────────────────────── */

const sortedTopics = [...(topics as TopicItem[])].sort(
  (a, b) => getMeta(a.title).priority - getMeta(b.title).priority
);

const TOP_COUNT = 4;
const highlighted = sortedTopics.slice(0, TOP_COUNT);
const remaining = sortedTopics.slice(TOP_COUNT);

/* ── Component ──────────────────────────────────────────────────── */

export default function AtalhoAjuda() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const visibleRemaining = showAll ? remaining : [];

  function toggleTopic(title: string) {
    setExpanded((prev) => (prev === title ? null : title));
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
      {/* Section header */}
      <div className="mb-10 text-center sm:mb-12">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Duvidas frequentes
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-gray-500 sm:text-lg">
          Encontre respostas rapidas para os assuntos mais procurados
        </p>
      </div>

      {/* Highlighted topics — card grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {highlighted.map((topic) => {
          const { icon: Icon } = getMeta(topic.title);
          const isOpen = expanded === topic.title;

          return (
            <button
              key={topic.title}
              type="button"
              onClick={() => toggleTopic(topic.title)}
              aria-expanded={isOpen}
              className={[
                "group relative flex flex-col items-center gap-2.5 rounded-2xl border p-4 text-center transition-all duration-200 sm:p-5",
                isOpen
                  ? "border-primary/40 bg-primary/[0.04] shadow-md ring-1 ring-primary/20"
                  : "border-gray-100 bg-white shadow-sm hover:border-primary/25 hover:shadow-md",
              ].join(" ")}
            >
              <div
                className={[
                  "flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-200",
                  isOpen
                    ? "bg-primary text-white"
                    : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[13px] font-semibold leading-snug text-gray-800 sm:text-sm">
                {topic.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Expanded content panel */}
      {expanded && (
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              {(() => {
                const { icon: Icon } = getMeta(expanded);
                return (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                );
              })()}
              <h3 className="text-base font-bold text-gray-900 sm:text-lg">
                {expanded}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(null)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Fechar"
            >
              <HiOutlineXMark className="h-5 w-5" />
            </button>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <div className="max-w-2xl space-y-2.5 text-[15px] leading-relaxed text-gray-600">
              {sortedTopics
                .find((t) => t.title === expanded)
                ?.content?.map((p, i) => <p key={i}>{p}</p>) || (
                <p className="italic text-gray-400">
                  Conteudo em atualizacao.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remaining topics — accordion */}
      {remaining.length > 0 && (
        <div className="mx-auto max-w-3xl">
          {!showAll ? (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mx-auto flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-800"
            >
              Ver todos os temas ({remaining.length} mais)
              <HiOutlineChevronDown className="h-4 w-4" />
            </button>
          ) : (
            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm">
              {visibleRemaining.map((topic) => {
                const { icon: Icon } = getMeta(topic.title);
                const isOpen = expanded === topic.title;

                return (
                  <div key={topic.title}>
                    <button
                      type="button"
                      onClick={() => toggleTopic(topic.title)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-gray-50 sm:px-6"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-sm font-semibold text-gray-800">
                        {topic.title}
                      </span>
                      <HiOutlineChevronDown
                        className={[
                          "h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200",
                          isOpen ? "rotate-180" : "",
                        ].join(" ")}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-gray-50 bg-gray-50/50 px-5 py-4 sm:px-6">
                        <div className="max-w-2xl space-y-2.5 pl-12 text-[15px] leading-relaxed text-gray-600">
                          {topic.content?.map((p, i) => (
                            <p key={i}>{p}</p>
                          )) || (
                            <p className="italic text-gray-400">
                              Conteudo em atualizacao.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

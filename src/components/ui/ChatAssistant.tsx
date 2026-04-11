"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineTruck,
  HiOutlineArrowPath,
  HiOutlineCreditCard,
  HiOutlineShoppingCart,
  HiOutlineShieldCheck,
  HiOutlineTag,
  HiOutlineShoppingBag,
  HiOutlineLockClosed,
  HiOutlineInformationCircle,
  HiOutlineUsers,
  HiOutlineArrowLeft,
  HiOutlineEnvelope,
} from "react-icons/hi2";
import { FaWhatsapp } from "react-icons/fa";
import topics from "@/data/topics";

/* ── Types ──────────────────────────────────────────────────────── */

type TopicItem = {
  title: string;
  description: string;
  content?: string[];
};

type Screen = "home" | "topic" | "search";

type Props = {
  whatsappUrl?: string;
};

/* ── Topic metadata ─────────────────────────────────────────────── */

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "Politica de Entrega": HiOutlineTruck,
  "Troca e Devolucao": HiOutlineArrowPath,
  "Pagamentos": HiOutlineCreditCard,
  "Como Comprar": HiOutlineShoppingCart,
  "Compra Segura": HiOutlineShieldCheck,
  "Cupom de Desconto": HiOutlineTag,
  "Produtos": HiOutlineShoppingBag,
  "Privacidade e Seguranca": HiOutlineLockClosed,
  "Sobre Nos": HiOutlineInformationCircle,
  "Contatos de nossos colaboradores": HiOutlineUsers,
};

const QUICK_TOPICS = [
  "Politica de Entrega",
  "Troca e Devolucao",
  "Pagamentos",
  "Como Comprar",
];

function normalizeKey(title: string) {
  return title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function getIcon(title: string) {
  return ICON_MAP[normalizeKey(title)] || HiOutlineInformationCircle;
}

function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

const allTopics = topics as TopicItem[];

/* ── Component ──────────────────────────────────────────────────── */

export default function ChatAssistant({ whatsappUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null);
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Delayed entrance
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Scroll to top when screen changes
  useEffect(() => {
    panelRef.current?.scrollTo(0, 0);
  }, [screen, selectedTopic]);

  // Focus search input when entering search screen
  useEffect(() => {
    if (screen === "search") inputRef.current?.focus();
  }, [screen]);

  const searchResults = useMemo(() => {
    const q = normalize(search);
    if (q.length < 2) return [];
    return allTopics.filter(
      (t) =>
        normalize(t.title).includes(q) ||
        normalize(t.description).includes(q) ||
        t.content?.some((p) => normalize(p).includes(q))
    );
  }, [search]);

  const openTopic = useCallback((topic: TopicItem) => {
    setSelectedTopic(topic);
    setScreen("topic");
  }, []);

  const goHome = useCallback(() => {
    setScreen("home");
    setSelectedTopic(null);
    setSearch("");
  }, []);

  function toggleOpen() {
    setOpen((v) => {
      if (!v) {
        goHome();
      }
      return !v;
    });
  }

  /* ── Render ────────────────────────────────────────────────────── */

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={open ? "Fechar assistente" : "Abrir assistente virtual"}
        className={[
          "fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-500",
          "sm:bottom-6 sm:right-6",
          open
            ? "bg-gray-800 text-white hover:bg-gray-700"
            : "bg-primary text-white hover:bg-primary-hover",
          visible
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-4 opacity-0 scale-90 pointer-events-none",
        ].join(" ")}
      >
        {open ? (
          <HiOutlineXMark className="h-6 w-6" />
        ) : (
          <HiOutlineChatBubbleLeftRight className="h-6 w-6" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className={[
            "fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/10",
            // Mobile: full width with margins
            "bottom-[5.5rem] left-3 right-3",
            // Desktop: fixed width anchored bottom-right
            "sm:left-auto sm:bottom-[5.5rem] sm:right-6 sm:w-[380px]",
            "max-h-[min(520px,calc(100vh-7rem))]",
          ].join(" ")}
        >
          {/* Header */}
          <div className="shrink-0 bg-gradient-to-r from-header to-secondary px-4 py-4">
            <div className="flex items-center gap-3">
              {screen !== "home" && (
                <button
                  type="button"
                  onClick={goHome}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label="Voltar"
                >
                  <HiOutlineArrowLeft className="h-4 w-4" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white">
                  Assistente Kavita
                </h3>
                <p className="text-[11px] text-white/60">
                  Respostas rapidas para suas duvidas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <HiOutlineXMark className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div ref={panelRef} className="flex-1 overflow-y-auto">
            {/* ── HOME ──────────────────────────────────────────── */}
            {screen === "home" && (
              <div className="p-4">
                {/* Greeting */}
                <div className="mb-4 rounded-xl bg-gray-50 p-3">
                  <p className="text-sm text-gray-700">
                    Ola! Como posso ajudar? Selecione um tema abaixo ou busque sua duvida.
                  </p>
                </div>

                {/* Search CTA */}
                <button
                  type="button"
                  onClick={() => setScreen("search")}
                  className="mb-4 flex w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-sm text-gray-400 transition hover:border-gray-300"
                >
                  <HiOutlineMagnifyingGlass className="h-4 w-4 shrink-0" />
                  Buscar nos temas de ajuda...
                </button>

                {/* Quick topics */}
                <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Assuntos mais procurados
                </p>
                <div className="space-y-1.5">
                  {allTopics
                    .filter((t) => QUICK_TOPICS.includes(normalizeKey(t.title)))
                    .map((topic) => {
                      const Icon = getIcon(topic.title);
                      return (
                        <button
                          key={topic.title}
                          type="button"
                          onClick={() => openTopic(topic)}
                          className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left transition hover:border-primary/20 hover:bg-primary/[0.02]"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {topic.title}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {topic.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                </div>

                {/* All topics */}
                <p className="mb-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Todos os temas
                </p>
                <div className="space-y-1">
                  {allTopics
                    .filter((t) => !QUICK_TOPICS.includes(normalizeKey(t.title)))
                    .map((topic) => {
                      const Icon = getIcon(topic.title);
                      return (
                        <button
                          key={topic.title}
                          type="button"
                          onClick={() => openTopic(topic)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-gray-600 transition hover:bg-gray-50"
                        >
                          <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                          <span className="truncate">{topic.title}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ── TOPIC DETAIL ──────────────────────────────────── */}
            {screen === "topic" && selectedTopic && (
              <div className="p-4">
                <div className="mb-3 flex items-center gap-2.5">
                  {(() => {
                    const Icon = getIcon(selectedTopic.title);
                    return (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                    );
                  })()}
                  <h4 className="text-sm font-bold text-gray-900">
                    {selectedTopic.title}
                  </h4>
                </div>

                {/* Content as chat-like bubbles */}
                <div className="space-y-2">
                  {selectedTopic.content?.map((p, i) => (
                    <div
                      key={i}
                      className="rounded-xl rounded-tl-sm bg-gray-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-gray-700"
                    >
                      {p}
                    </div>
                  )) || (
                    <div className="rounded-xl bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-400 italic">
                      Conteudo em atualizacao.
                    </div>
                  )}
                </div>

                {/* Helpful? */}
                <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-center">
                  <p className="text-xs text-gray-500 mb-2">
                    Isso respondeu sua duvida?
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={goHome}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300"
                    >
                      Sim, obrigado
                    </button>
                    <a
                      href="/contato#formulario"
                      className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/10"
                    >
                      Preciso de mais ajuda
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* ── SEARCH ────────────────────────────────────────── */}
            {screen === "search" && (
              <div className="p-4">
                <div className="relative mb-4">
                  <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Digite sua duvida..."
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                {search.trim().length < 2 && (
                  <p className="text-center text-xs text-gray-400">
                    Digite pelo menos 2 caracteres para buscar
                  </p>
                )}

                {search.trim().length >= 2 && searchResults.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-3">
                      Nenhum resultado para &ldquo;{search}&rdquo;
                    </p>
                    <a
                      href="/contato#formulario"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-hover"
                    >
                      Enviar mensagem para a equipe
                    </a>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400 mb-2">
                      {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""}
                    </p>
                    {searchResults.map((topic) => {
                      const Icon = getIcon(topic.title);
                      return (
                        <button
                          key={topic.title}
                          type="button"
                          onClick={() => openTopic(topic)}
                          className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left transition hover:border-primary/20 hover:bg-primary/[0.02]"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {topic.title}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {topic.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer — escalation channels */}
          <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-whatsapp px-3 py-2 text-xs font-semibold text-white transition hover:bg-whatsapp-hover"
                >
                  <FaWhatsapp className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              )}
              <a
                href="/contato#formulario"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                <HiOutlineEnvelope className="h-3.5 w-3.5" />
                Formulario
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

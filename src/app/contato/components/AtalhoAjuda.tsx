"use client";

import { useState } from "react";
import {
  HiOutlineShoppingBag,
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
} from "react-icons/hi2";
import topics from "@/data/topics";

type TopicItem = {
  title: string;
  description: string;
  content?: string[];
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "Sobre Nos": HiOutlineInformationCircle,
  "Produtos": HiOutlineShoppingBag,
  "Politica de Entrega": HiOutlineTruck,
  "Como Comprar": HiOutlineShoppingCart,
  "Compra Segura": HiOutlineShieldCheck,
  "Troca e Devolucao": HiOutlineArrowPath,
  "Privacidade e Seguranca": HiOutlineLockClosed,
  "Cupom de Desconto": HiOutlineTag,
  "Pagamentos": HiOutlineCreditCard,
  "Contatos de nossos colaboradores": HiOutlineUsers,
};

function normalizeKey(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getIcon(title: string) {
  const key = normalizeKey(title);
  return ICON_MAP[key] || HiOutlineInformationCircle;
}

export default function AtalhoAjuda() {
  const [selected, setSelected] = useState<TopicItem | null>(null);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="text-center mb-8 sm:mb-10">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Como podemos ajudar?
        </h2>
        <p className="mt-2 text-gray-600 sm:text-lg">
          Selecione um tema para encontrar respostas rapidas
        </p>
      </div>

      {!selected ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
          {(topics as TopicItem[]).map((topic) => {
            const Icon = getIcon(topic.title);
            return (
              <button
                key={topic.title}
                type="button"
                onClick={() => setSelected(topic)}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md hover:bg-primary/[0.02] focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-center text-sm font-medium text-gray-800 leading-tight">
                  {topic.title}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = getIcon(selected.title);
                  return (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                  );
                })()}
                <h3 className="text-xl font-bold text-gray-900">
                  {selected.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Fechar"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-gray-700 leading-relaxed">
              {selected.content?.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              )) || (
                <p className="text-gray-500 italic">
                  Informacoes em breve.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover transition"
            >
              ← Voltar para todos os temas
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

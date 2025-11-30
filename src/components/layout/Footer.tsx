"use client";

import { useEffect, useState } from "react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import Link from "next/link";

const Footer = () => {
  // 🔒 Corrige hidratação: ano calculado só no cliente
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-[#083E46] text-white pt-12 pb-16 sm:py-20 mt-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* Marca + chamada para prestadores */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Kavita</h2>
          <p className="text-sm sm:text-base text-gray-300">
            Conectando você ao melhor da agropecuária com qualidade e tradição.
          </p>

          <div className="mt-4 rounded-xl bg-white/5 p-3 text-xs sm:text-sm text-gray-100">
            <p className="font-semibold text-emerald-200 mb-1">
              É profissional do campo?
            </p>
            <p>
              Veterinário, agrônomo, mecânico de máquinas, consultor ou prestador
              de serviços rurais:{" "}
              <Link
                href="/trabalhe-conosco"
                className="underline font-semibold text-emerald-200 hover:text-emerald-100"
              >
                trabalhe conosco
              </Link>{" "}
              e entre para a rede de parceiros Kavita.
            </p>
          </div>
        </div>

        {/* Navegação */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Navegação</h3>
          <ul className="space-y-2 text-sm sm:text-base">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/servicos">Serviços</Link>
            </li>
            <li>
              <Link href="/contato">Contato</Link>
            </li>
            {/* Link direto para área de serviços / prestadores */}
            <li>
              <Link href="/servicos" className="font-semibold text-emerald-200">
                Prestação de serviços
              </Link>
            </li>
            {/* CTA para cadastro / interesse em trabalhar com a Kavita */}
            <li>
              <Link
                href="/trabalhe-conosco"
                className="font-semibold text-emerald-200"
              >
                Trabalhe conosco
              </Link>
            </li>
          </ul>
        </div>

        {/* Contato */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Contato</h3>
          <ul className="space-y-2 text-sm sm:text-base">
            <li className="flex items-center gap-2">
              <FaWhatsapp /> (31) 99999-9999
            </li>
            <li className="flex items-center gap-2">
              <MdEmail /> contato@kavita.com.br
            </li>
          </ul>
        </div>

        {/* Redes Sociais */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Redes Sociais</h3>
          <div className="flex items-center gap-4 text-xl">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
            <a
              href="https://wa.me/5531999999999"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
            >
              <FaWhatsapp />
            </a>
          </div>
        </div>
      </div>

      <div className="text-center text-gray-300 text-xs sm:text-sm mt-8 sm:mt-10 px-4">
        © {year ?? ""} Kavita - Todos os direitos reservados.
      </div>
    </footer>
  );
};

export default Footer;

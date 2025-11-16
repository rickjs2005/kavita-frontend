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
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Kavita</h2>
          <p className="text-sm sm:text-base text-gray-300">
            Conectando você ao melhor da agropecuária com qualidade e tradição.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Navegação</h3>
          <ul className="space-y-2 text-sm sm:text-base">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/servicos">Serviços</Link></li>
            <li><Link href="/contato">Contato</Link></li>
          </ul>
        </div>

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

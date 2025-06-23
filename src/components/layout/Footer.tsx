// Indica que este componente será renderizado no lado do cliente
"use client";

// Importa ícones de redes sociais
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

// Importa Link do Next.js para navegação entre páginas
import Link from "next/link";

// Componente de rodapé
const Footer = () => {
  return (
    <footer className="bg-[#083E46] text-white py-20 mt-10">
      {/* Container com limite de largura e layout em grid responsivo */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

        {/* Coluna 1: Logo e descrição */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Kavita</h2>
          <p className="text-sm text-gray-300">
            Conectando você ao melhor da agropecuária com qualidade e tradição.
          </p>
        </div>

        {/* Coluna 2: Links de navegação */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Navegação</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/servicos">Serviços</Link></li>
            <li><Link href="/contato">Contato</Link></li>
          </ul>
        </div>

        {/* Coluna 3: Informações de contato */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Contato</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <FaWhatsapp /> (31) 99999-9999
            </li>
            <li className="flex items-center gap-2">
              <MdEmail /> contato@kavita.com.br
            </li>
          </ul>
        </div>

        {/* Coluna 4: Redes sociais */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Redes Sociais</h3>
          <div className="flex items-center gap-4 text-xl">
            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram />
            </a>
            {/* WhatsApp */}
            <a
              href="https://wa.me/5531999999999"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaWhatsapp />
            </a>
          </div>
        </div>
      </div>

      {/* Rodapé inferior com direitos autorais */}
      <div className="text-center text-gray-400 text-sm mt-10">
        © {new Date().getFullYear()} Kavita - Todos os direitos reservados.
      </div>
    </footer>
  );
};

// Exporta o componente para ser usado em outras partes do site
export default Footer;
// Este componente Footer renderiza o rodapé do site
// Ele inclui informações de contato, links de navegação e ícones de redes sociais
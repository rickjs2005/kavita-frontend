"use client"; // Indica que esse componente será executado no cliente (importante para hooks como useState)

// Importações necessárias
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FaShoppingCart } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import CartCar from "../cart/CartCar";
import SearchBar from "../ui/SearchBar";

// Rotas principais do menu
const NAV_LINKS = [
  { route: "/medicamentos", label: "Medicamentos" },
  { route: "/pets", label: "Pets" },
  { route: "/fertilizantes", label: "Fazenda" },
  { route: "/drones", label: "Kavita-Drone" },
  { route: "/servicos", label: "Serviços" },
  { route: "/pragas-e-insetos", label: "Pragas e insetos" },
  { route: "/outros", label: "Outros" },
];

// Rotas em que o header não deve ser exibido
const EXCLUDED_ROUTES = [
  "/checkout", "/login", "/register", "/forgot-password", 
  "/admin", "/admin/login", "/admin/produtos", "/admin/destaques", 
  "/admin/pedidos", "/admin/servicos"
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false); // Detecta rolagem da página
  const [isCartOpen, setIsCartOpen] = useState(false); // Controla visibilidade do carrinho lateral
  const { cartItems } = useCart(); // Itens no carrinho
  const { isAuthenticated, userName, logout } = useAuth(); // Autenticação e dados do usuário
  const pathname = usePathname(); // Rota atual

  const isDronePage = pathname === "/drones"; // Troca o logo caso esteja na rota de drone
  const cartCount = cartItems.length; // Quantidade de itens no carrinho

  // Calcula o valor total do carrinho apenas quando houver mudança
  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  // Adiciona e remove evento de rolagem para mudar o estilo do header
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Oculta o header em páginas específicas
  if (EXCLUDED_ROUTES.includes(pathname)) return null;

  return (
    <>
      {/* Header fixo no topo */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-transparent backdrop-blur-md" : "bg-[#083E46]"
        }`}
      >
        <div className="w-full h-[108px] flex items-center justify-between px-8">
          
          {/* Logo da loja */}
          <Link href="/" className="flex items-center ml-12">
            <Image
              src={isDronePage ? "/images/drone/kavita-drone.png" : "/images/kavita2.png"}
              alt="Logo da Loja"
              width={80}
              height={24}
              className="cursor-pointer"
            />
          </Link>

          {/* Barra de busca */}
          <div className="flex-1 flex justify-center mx-8">
            <SearchBar onSearch={(query: string) => console.log("Buscando por:", query)} />
          </div>

          {/* Ações de atendimento e login */}
          <div className="flex items-center space-x-16">
            {/* Link de contato/atendimento */}
            <Link
              href="/contato"
              className={`hover:text-[#EC5B20] transition-colors duration-300 ${
                isScrolled ? "text-[#359293]" : "text-white"
              }`}
            >
              Atendimento
            </Link>

            {/* Se o usuário estiver logado, mostra nome e botão de sair */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span
                  className={`hover:text-[#EC5B20] transition-colors duration-300 ${
                    isScrolled ? "text-[#359293]" : "text-white"
                  }`}
                >
                  Bem-vindo, {userName || "Usuário"}
                </span>
                <button onClick={logout} className="text-red-500 text-sm">
                  Sair
                </button>
              </div>
            ) : (
              // Caso contrário, mostra link para login
              <Link
                href="/login"
                className={`hover:text-[#EC5B20] transition-colors duration-300 ${
                  isScrolled ? "text-[#359293]" : "text-white"
                }`}
              >
                Login / Meus Pedidos
              </Link>
            )}
          </div>

          {/* Ícone do carrinho de compras com contador */}
          <div className="relative ml-7 rounded-full hover:bg-[#2b797a]">
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className={`transition-colors duration-300 ${
                isScrolled ? "text-[#359293]" : "text-[#EC5B20]"
              }`}
            >
              <FaShoppingCart size={38} />
            </button>

            {/* Bolinha com número de itens */}
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-white text-lime-500 text-sm rounded-full w-6 h-6 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
        </div>

        {/* Menu de navegação */}
        <nav
          className={`w-full h-[44px] ${
            isScrolled ? "bg-transparent" : "bg-[#038284]"
          } text-white transition-all duration-300`}
        >
          <ul className="flex items-center justify-evenly h-full">
            {NAV_LINKS.map(({ route, label }) => (
              <li key={route}>
                <Link
                  href={route}
                  className={`hover:text-[#EC5B20] transition-colors duration-300 ${
                    pathname === route ? "text-[#EC5B20]" : isScrolled ? "text-[#359293]" : "text-white"
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Carrinho lateral (abre na lateral direita) */}
      <div className="flex">
        <main className={`flex-1 transition-all duration-300 ${isCartOpen ? "ml-96" : "ml-0"}`}>
          <CartCar isCartOpen={isCartOpen} closeCart={() => setIsCartOpen(false)} />
        </main>
      </div>

      {/* Espaço reservado para compensar altura do header fixo */}
      <div className="h-[152px]"></div>
    </>
  );
};

export default Header;
// O componente Header é responsável por renderizar o cabeçalho da aplicação
// Ele inclui o logo, barra de busca, links de navegação e carrinho de compras
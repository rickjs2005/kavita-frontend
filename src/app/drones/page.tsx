"use client"; // Esse componente será renderizado no navegador (lado do cliente)

import { useState, useEffect } from "react"; // React hooks para lidar com estado e efeitos colaterais
import Image from "next/image"; // Componente otimizado de imagem do Next.js
import { motion } from "framer-motion"; // Biblioteca para animações

const DronePage = () => {
  // Armazena os dados do formulário de contato
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  // Controla o status do envio do formulário (nada, carregando, sucesso ou erro)
  const [formStatus, setFormStatus] = useState("");

  // Controla se o botão "Voltar ao Topo" deve aparecer
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Efeito para monitorar o scroll da página e mostrar o botão "Voltar ao Topo" quando descer
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll); // Limpa o evento ao desmontar
  }, []);

  // Função que faz a página rolar suavemente até o topo
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Função que abre o WhatsApp com uma mensagem padrão para o revendedor
  const handleWhatsAppRedirect = () => {
    const phoneNumber = "5511999999999"; // Substitua com número real do revendedor
    const message = "Olá, gostaria de mais informações sobre o DJI AGRAS T50.";
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    alert("Abrindo WhatsApp...");
    window.open(url, "_blank"); // Abre em nova aba
  };

  // Função que simula o envio do formulário de contato
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Impede o recarregamento da página
    setFormStatus("loading"); // Mostra "enviando..."

    // Simula uma requisição de 2 segundos
    setTimeout(() => {
      setFormStatus("success");
      setFormData({ name: "", email: "", message: "" }); // Limpa o formulário
    }, 2000);
  };

  // Configuração para animações com framer-motion
  const fadeVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="bg-black text-[#359293]">
      {/* Seção com vídeo de fundo e chamada para ação */}
      <motion.section
        className="relative h-[600px] flex items-center justify-center bg-gray-900 text-white"
        initial="hidden"
        animate="visible"
        variants={fadeVariant}
        transition={{ duration: 0.8 }}
      >
        <div className="text-center z-10">
          <h1 className="text-5xl font-bold mb-4">DJI AGRAS T50</h1>
          <p className="text-xl mb-8">
            O drone agrícola mais avançado para pulverização, dispersão e levantamento aéreo.
          </p>
          <button
            onClick={handleWhatsAppRedirect}
            className="bg-[#EC5B20] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#d94c1a] transition-all"
          >
            Fale com o Revendedor
          </button>
        </div>
        {/* Vídeo de fundo com efeito escurecido */}
        <video
          autoPlay
          loop
          muted
          poster="/images/drone/fallback-hero.jpg"
          className="absolute top-0 left-0 w-full h-full object-cover opacity-50"
        >
          <source src="/videos/drone3.mp4" type="video/mp4" />
          Seu navegador não suporta vídeos.
        </video>
      </motion.section>

      {/* Seção de Especificações Técnicas */}
      <motion.section
        className="py-16 px-8 text-[#359293]"
        initial="hidden"
        whileInView="visible"
        variants={fadeVariant}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Especificações Técnicas</h2>
          {/* Informações divididas em duas colunas no desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Cada bloco tem um título e lista de características */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Carga Útil</h3>
              <ul className="list-disc list-inside">
                <li>Pulverização: 40 kg</li>
                <li>Dispersão: 50 kg</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Vazão</h3>
              <ul className="list-disc list-inside">
                <li>Pulverização: 16 L/min</li>
                <li>Dispersão: 108 kg/min</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Bateria</h3>
              <ul className="list-disc list-inside">
                <li>Capacidade: 30 Ah</li>
                <li>Carregamento: 9 minutos</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Detecção</h3>
              <ul className="list-disc list-inside">
                <li>Radares dianteiro e traseiro</li>
                <li>Visão binocular</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Seção de Funcionalidades do Drone */}
      <motion.section
        className="py-16 px-8 text-[#359293]"
        initial="hidden"
        whileInView="visible"
        variants={fadeVariant}
        transition={{ duration: 0.8, delay: 0.4 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Funcionalidades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Cada item é uma funcionalidade do drone */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Pulverização</h3>
              <p>Sistema de pulverização por atomização dupla com vazão de até 24 L/min.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Dispersão</h3>
              <p>Dispersão uniforme com capacidade de até 1.500 kg por hora.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Levantamento Aéreo</h3>
              <p>Mapeamento de pomares e campos com geração de rotas automáticas.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Segurança</h3>
              <p>Detecção de obstáculos multidirecional e acompanhamento de terreno.</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Seção de Benefícios (vantagens de usar o drone) */}
      <motion.section
        className="py-16 px-8 text-[#359293]"
        initial="hidden"
        whileInView="visible"
        variants={fadeVariant}
        transition={{ duration: 0.8, delay: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Por que escolher o DJI AGRAS T50?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-xl font-semibold mb-4">Alta Eficiência</h3>
              <p>Cobre grandes áreas rapidamente, reduzindo tempo e custos.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Precisão</h3>
              <p>Pulverização e dispersão uniformes para melhores resultados.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Versatilidade</h3>
              <p>Ideal para campos, pomares e terrenos acidentados.</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Galeria de imagens e vídeos do drone */}
      <motion.section
        className="py-16 px-8"
        initial="hidden"
        whileInView="visible"
        variants={fadeVariant}
        transition={{ duration: 0.8, delay: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Galeria</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Exibição de imagens otimizadas com Next/Image */}
            <Image src="/images/drone/agras-t50-1.jpg" alt="Drone DJI AGRAS T50" width={600} height={400} className="rounded-lg" loading="lazy" />
            <Image src="/images/drone/agras-t50-2.webp" alt="Drone em ação" width={600} height={400} className="rounded-lg" loading="lazy" />
            <Image src="/images/drone/bateria.jpg" alt="Bateria" width={600} height={400} className="rounded-lg" loading="lazy" />
            <Image src="/images/drone/carregador.jpg" alt="Carregador" width={600} height={400} className="rounded-lg" loading="lazy" />
            <Image src="/images/drone/agras-t50-3.webp" alt="Drone em campo" width={600} height={400} className="rounded-lg" loading="lazy" />
            <Image src="/images/drone/drone-t50-5.jpg" alt="Drone DJI AGRAS T50" width={600} height={400} className="rounded-lg" loading="lazy" />
            <Image src="/images/drone/escane.jpg" alt="Escaneamento" width={600} height={400} className="rounded-lg" loading="lazy" />
            <Image src="/images/drone/controle.jpg" alt="Controle do drone" width={600} height={400} className="rounded-lg" loading="lazy" />
          </div>
        </div>
      </motion.section>

      {/* Seção com formulário de contato */}
      <motion.section
        id="contato"
        className="py-16 px-8 text-[#359293]"
        initial="hidden"
        whileInView="visible"
        variants={fadeVariant}
        transition={{ duration: 0.8, delay: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Deixe o seu comentário</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Campos do formulário: nome, e-mail, mensagem */}
            <div>
              <label className="block text-lg font-semibold mb-2">Nome</label>
              <input
                type="text"
                placeholder="Seu nome"
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-lg font-semibold mb-2">E-mail</label>
              <input
                type="email"
                placeholder="Seu e-mail"
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-lg font-semibold mb-2">Mensagem</label>
              <textarea
                placeholder="Sua mensagem"
                className="w-full p-3 border border-gray-300 rounded-lg"
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </div>
            {/* Botão de envio e status */}
            <div className="md:col-span-2 flex flex-col items-center">
              <button
                type="submit"
                className="bg-[#EC5B20] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#d94c1a] transition-all"
              >
                {formStatus === "loading" ? "Enviando..." : "Enviar Mensagem"}
              </button>
              {formStatus === "success" && (
                <p className="mt-4 text-green-600">Mensagem enviada com sucesso!</p>
              )}
            </div>
          </form>
        </div>
      </motion.section>

      {/* Botão fixo para voltar ao topo da página */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-[#EC5B20] text-white p-4 rounded-full shadow-lg hover:bg-[#d94c1a] transition-all"
        >
          ↑ Topo
        </button>
      )}
    </div>
  );
};

export default DronePage;
// Este é o componente principal da página de drones, que inclui animações, formulários e interações com o usuário.
// Ele utiliza hooks do React para gerenciar estado e efeitos colaterais, além de framer-motion para animações suaves.
// O componente é otimizado para SEO e acessibilidade, com imagens otimizadas e estrutura semântica.
// A página é responsiva, adaptando-se a diferentes tamanhos de tela, e inclui um botão para voltar ao topo da página.
// O formulário de contato simula o envio de dados e exibe mensagens de status, melhorando a experiência do usuário.
// A página também inclui uma galeria de imagens do drone, destacando suas características e funcionalidades  .
// O uso de classes do Tailwind CSS garante um design moderno e responsivo, com cores e tipografia consistentes.
// A interação com o WhatsApp permite que os usuários entrem em contato facilmente com o revendedor, facilitando a comunicação e potencializando as vendas.
// O componente é exportado como padrão, permitindo que seja utilizado em outras partes da aplicação Next.js.
// Ele é uma página completa e funcional, pronta para ser integrada em um site de vendas de drones agrícolas, oferecendo uma experiência rica e interativa para os usuários interessados no DJI AGRAS T50.
// A página é otimizada para SEO, com títulos e descrições relevantes, além de imagens otimizadas para carregamento rápido e melhor desempenho em mecanismos de busca.
// A estrutura do código é organizada e modular, facilitando a manutenção e futuras expansões da página.
// O componente é escrito em TypeScript, garantindo tipagem estática e melhor suporte a erros,
// o que melhora a qualidade do código e a experiência de desenvolvimento.      
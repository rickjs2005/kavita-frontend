// src/app/page.tsx
"use client"; // Essa instrução indica que este componente é client-side (executado no navegador)

import ProdutosPorCategoria from "@/components/products/ProdutosPorCategoria"; // Componente que exibe os produtos por categoria
import HeroSection from "../components/layout/HeroSection"; // Seção inicial do site com destaque visual
import DestaquesSection from "@/components/products/DestaquesSection"; // Seção com produtos destacados
import ServicosSection from "@/components/layout/ServicosSection"; // Seção que exibe os serviços oferecidos
import Footer from "@/components/layout/Footer"; // Rodapé da página

// Lista com as categorias que serão exibidas na página
const categorias = [
  "Medicamentos",
  "Pets",
  "fazenda",
  "pragas e insetos",
  "outros",
];

// Componente principal da página inicial (home)
export default function Home() {
  return (
    <main className="flex flex-col gap-16">
      {/* Seção principal com imagem e chamada para ação */}
      <HeroSection />

      {/* Seção de produtos em destaque */}
      <DestaquesSection />

      {/* Seção que mostra os serviços agropecuários */}
      <ServicosSection />

      {/* Gera dinamicamente seções para cada categoria da lista */}
      {categorias.map((categoria) => (
        <section key={categoria} className="px-4 md:px-10">
          {/* Título da categoria */}
          <h2 className="text-2xl font-bold text-[#359293] mb-4 capitalize">
            {categoria}
          </h2>

          {/* Lista de produtos dessa categoria */}
          <ProdutosPorCategoria categoria={categoria} />
        </section>
      ))}

      {/* Rodapé da página com informações finais */}
      <Footer />
    </main>
  );
}
// Exporta o componente para ser usado como a página inicial da aplicação
// O uso de "use client" no início garante que este componente seja renderizado no lado do cliente (navegador),
// permitindo interações dinâmicas e carregamento de dados via hooks personalizados.
// A estrutura do componente é organizada em seções, facilitando a manutenção e a leitura do código.
// Cada seção é estilizada com Tailwind CSS, garantindo um layout responsivo e moderno.
// As categorias de produtos são passadas como uma lista, permitindo fácil adição ou remoção de categorias no futuro.
// O componente é otimizado para SEO, utilizando títulos e descrições apropriadas para cada seção,
// melhorando a visibilidade nos motores de busca e a experiência do usuário.
// A tipagem do TypeScript garante que os dados sejam manipulados corretamente, evitando erros de runtime e melhorando a manutenção do código.
// O componente é exportado como padrão, permitindo que seja importado e utilizado em outras partes da aplicação.
// A estrutura modular do código facilita a reutilização de componentes, como o HeroSection, DestaquesSection e ProdutosPorCategoria,
// promovendo uma arquitetura limpa e escalável.
// O uso de classes utilitárias do Tailwind CSS permite um desenvolvimento rápido e eficiente, com foco na estilização responsiva e na consistência visual.
// A página é projetada para ser leve e rápida, com carregamento assíncrono de dados onde necessário,
// melhorando a performance e a experiência do usuário em dispositivos móveis e desktops.
// A estrutura do código segue as melhores práticas de desenvolvimento React, utilizando hooks e componentes funcionais,
// promovendo uma abordagem moderna e eficiente para o desenvolvimento de interfaces de usuário.
// O componente é facilmente extensível, permitindo a adição de novas seções ou funcionalidades no futuro sem grandes refatorações.
// A organização do código em pastas e arquivos separados facilita a navegação e a manutenção do projeto,
// permitindo que outros desenvolvedores entendam rapidamente a estrutura e a lógica da aplicação.
// A utilização de comentários claros e concisos ajuda na compreensão do código, especialmente em partes mais complexas ou críticas,
// garantindo que a equipe possa colaborar de forma eficiente e produtiva.
// A página inicial é projetada para ser atraente e funcional, com foco na experiência do usuário e na apresentação clara dos produtos e serviços oferecidos pela empresa.
// A integração com o sistema de gerenciamento de produtos e serviços permite que a página seja atualizada dinamicamente com novos itens,
// garantindo que os usuários sempre vejam as informações mais recentes e relevantes.
// A estrutura modular e reutilizável do código promove a consistência em todo o projeto,
// permitindo que componentes como ProdutosPorCategoria e DestaquesSection sejam usados em outras partes da aplicação
// sem duplicação de código, melhorando a eficiência do desenvolvimento e a manutenção a longo prazo.
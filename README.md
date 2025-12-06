Kavita Frontend

Kavita é uma plataforma de e‑commerce voltada para o setor agropecuário, permitindo a comercialização de produtos e serviços em um único lugar. Este repositório contém o código do front‑end da aplicação, desenvolvido com Next.js, TypeScript e TailwindCSS. A interface foi projetada para oferecer uma experiência moderna e intuitiva tanto para clientes quanto para administradores.

✨ Visão geral

Frontend completo com páginas dinâmicas, carrinho, checkout com cupom de desconto e integração com gateway de pagamento.

Suporte a produtos e serviços: exibe categorias, produtos com detalhes, promoções, avaliações de usuários e lista de serviços com informações de contato.

Área administrativa protegida com autenticação JWT, permitindo cadastro, edição e exclusão de produtos, serviços, promoções e gestão de pedidos.

🛠️ Tecnologias principais

Next.js 15 – Renderização server‑side, roteamento de arquivos e API Routes
github.com
.

React 19 com TypeScript – Tipagem estática e componentes funcionais.

TailwindCSS – Framework utilitário para estilos responsivos e modernos
github.com
.

Context API + Hooks – Gerenciamento de estado global (autenticação, carrinho, checkout).

React Hook Form + Zod – Formulários reativos com validação descritiva
github.com
.

Axios/Fetch – Consumo de API RESTful com tratamento de erros e normalização de dados
github.com
.

📂 Estrutura de pastas
src/
 ├─ app/                 # Rotas de página (Next.js)
 │  ├─ categorias/       # Páginas dinâmicas para cada categoria
 │  ├─ produtos/         # Páginas de listagem e detalhes de produtos
 │  ├─ servicos/         # Listagem e detalhes de serviços
 │  ├─ checkout/         # Página de checkout com etapas de compra
 │  └─ admin/            # Área administrativa (CRUD de produtos, serviços, pedidos)
 ├─ components/          # Componentes reutilizáveis
 │  ├─ admin/            # Componentes do painel administrativo
 │  ├─ products/         # Componentes de produtos (cards, buy box, etc.)
 │  ├─ checkout/         # Forms de checkout (dados pessoais, endereço, pagamento)
 │  └─ ui/               # Botões, formulários, galerias e outros
 ├─ context/             # Contextos globais: Auth, Cart, CheckoutForm
 ├─ hooks/               # Hooks customizados
 └─ types/               # Tipagens de entidades (Product, Service, etc.)
public/                  # Arquivos estáticos e imagens
README.md                # Este documento

✅ Funcionalidades
Área pública

Home – Destaque de categorias e produtos em formato de carrossel. Exibe banner principal e produtos em promoção.

Busca – Pesquisa simultânea de produtos e serviços com exibição dos resultados por categoria
github.com
.

Produtos – Páginas de listagem com filtros básicos e páginas de detalhes exibindo galeria de imagens, preço original e promocional, disponibilidade de estoque, avaliações de clientes e formulário de review
github.com
.

Serviços – Listagem de serviços oferecidos com imagem, descrição, preço (se existir) e link para contato/WhatsApp.

Carrinho – Adição e remoção de itens, cálculo de subtotal e persistência via localStorage.

Checkout – Formulários para dados pessoais, endereço, método de pagamento e cupom; resumo do pedido e integração com gateway de pagamento (Mercado Pago)
github.com
.

Autenticação – Cadastro e login de usuários, com sessão persistida em localStorage.

Área administrativa

Login de administrador com proteção por cookie adminToken e redirecionamento automático para a página de login se não houver sessão ativa
github.com
.

Dashboard para visualização e gerenciamento de produtos, serviços e pedidos.

CRUD completo de produtos, incluindo upload de imagens, promoções, destaque e controle de estoque.

Gerenciamento de serviços com cadastro de colaboradores e informações de contato.

Gestão de pedidos – Visualização dos pedidos feitos pelos clientes, edição de status e atualização de itens.

🚀 Como executar

Clone o repositório e instale as dependências:

git clone https://github.com/seu-usuario/kavita-frontend.git
cd kavita-frontend
npm install


Configuração do ambiente: crie um arquivo .env.local na raiz com a URL da API backend:

NEXT_PUBLIC_API_URL=http://localhost:5000


Rodar em modo de desenvolvimento:

npm run dev
# o projeto ficará disponível em http://localhost:3000


Build para produção:

npm run build
npm start


Pré‑requisitos

Node.js (versão compatível com Next.js 15)

Backend da aplicação executando em http://localhost:5000

🔒 Autenticação

Usuários comuns: registram‑se e fazem login pela interface pública, com dados armazenados em localStorage.

Administradores: utilizam login específico (/admin/login); o token JWT é salvo em cookie e checado nas rotas protegidas
github.com
.

📈 Próximos passos

Implementar filtros avançados na busca e listagem de produtos (por preço, avaliação, marca).

Adicionar lista de desejos (wishlist) e recomendações personalizadas.

Integrar cálculo de frete em tempo real e outros gateways de pagamento.

Melhorar o SEO adicionando metadados e dados estruturados.
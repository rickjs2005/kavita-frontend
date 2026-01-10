Kavita Frontend

Kavita é uma plataforma de e-commerce voltada para o setor agropecuário, com foco na região da Zona da Mata. Permite a venda de produtos agrícolas e serviços especializados em um só lugar, além de oferecer conteúdo informativo relevante (clima, cotações de mercado, notícias) para produtores rurais. Este repositório contém o código front-end da aplicação, desenvolvido em Next.js (React) com TypeScript e Tailwind CSS, proporcionando uma experiência moderna e responsiva tanto para os clientes quanto para os administradores do sistema.

🛠️ Tecnologias e ferramentas principais

Next.js 15 – Framework React com renderização server-side e roteamento baseado em arquivos (App Router) para melhor performance e SEO.

React 19 + TypeScript – Biblioteca de interface com tipagem estática, garantindo manutenibilidade e uso de componentes funcionais modernos.

Tailwind CSS 3 – Framework de utilitários CSS para estilização rápida e design responsivo consistente.

Context API & Hooks – Gerenciamento de estado global (autenticação de usuários/admin, carrinho, formulário de checkout) via Context, além de hooks customizados para lógica reutilizável.

React Hook Form + Zod – Criação de formulários com validação schema-first, garantindo entradas de dados seguras e feedback em tempo real.

Axios (e Fetch API) – Consumo de API RESTful do back-end, com tratamento centralizado de erros e normalização de respostas.

Vitest + Testing Library – Suíte de testes unitários e de componentes para assegurar a qualidade do código. Testes cobrem componentes (UI), hooks e contextos, utilizando JSDOM e utilitários do Testing Library.

📂 Estrutura de pastas
src/
├─ app/                   # Rotas de páginas (Next.js App Router)
│  ├─ categorias/         # Páginas dinâmicas de listagem por categoria de produto
│  ├─ produtos/           # Páginas de listagem de produtos e detalhes de um produto
│  ├─ servicos/           # Páginas de listagem de serviços e detalhes de serviço
│  ├─ checkout/           # Fluxo de checkout (carrinho, endereço, pagamento)
│  ├─ admin/              # Área administrativa (login e páginas protegidas para gestão)
│  │  ├─ produtos/        # CRUD de produtos (listar, criar, editar, excluir)
│  │  ├─ servicos/        # CRUD de serviços (listar, criar, editar, excluir)
│  │  ├─ pedidos/         # Gestão de pedidos (lista, detalhes, atualização de status)
│  │  ├─ cupons/          # Gestão de cupons de desconto (criação/edição de códigos)
│  │  ├─ frete/           # Configuração de fretes (zonas de entrega, preços, prazos)
│  │  ├─ destaques/       # Marketing & Promoções (gerenciar campanhas de promoção)
│  │  └─ kavita-news/     # Gestão de conteúdo (clima, cotações, posts do blog)
│  └─ news/               # Seção de notícias (Kavita News)
│     ├─ clima/           # Páginas de clima (lista de locais e detalhes de chuva)
│     ├─ cotacoes/        # Páginas de cotações de mercado (lista de ativos e detalhes)
│     └─ posts/           # Páginas de posts de notícias/blog (lista e conteúdo)
├─ components/            # Componentes reutilizáveis da interface
│  ├─ admin/              # Componentes do painel admin (formulários, tabelas, etc.)
│  ├─ products/           # Componentes de produtos (cards, galeria, seção de promoções)
│  ├─ checkout/           # Componentes do checkout (form endereço, pagamento, etc.)
│  ├─ news/               # Componentes de notícias (cards de clima, cotações, posts)
│  └─ ui/                 # Componentes genéricos (botões, inputs, modal, etc.)
├─ context/               # Contextos globais (AuthContext, AdminAuthContext, CartContext...)
├─ hooks/                 # Hooks customizados (ex: useFetchProdutos, useCheckoutForm)
├─ services/              # Serviços utilitários (ex: cálculo de frete, integração com APIs)
├─ types/                 # Definições TypeScript de tipos e interfaces (Product, Service, Cotação etc.)
└─ __tests__/             # Testes automatizados (unitários e integração leve)

✅ Funcionalidades
Área pública (cliente)

Home: página inicial destacando categorias e produtos em promoção em formato de carrossel. Apresenta banner principal e ofertas em destaque para o usuário.

Busca global: campo de pesquisa que abrange produtos e serviços, retornando resultados filtrados por categoria de forma simultânea para agilizar a localização do que o usuário precisa.

Listagem de produtos: páginas que exibem os produtos de cada categoria, com filtros básicos (por nome, categoria, etc.). Cada produto apresenta nome, imagem, preço e indicação se está em promoção. É possível visualizar a página de detalhe do produto contendo galeria de fotos, descrição, preço original vs. promocional (quando aplicável), disponibilidade em estoque, avaliações de clientes e um formulário para o cliente enviar uma avaliação/review do produto.

Listagem de serviços: página mostrando os serviços oferecidos (ex: consultoria agrícola, manutenção de máquinas), com imagem, descrição e preço (se aplicável). Cada serviço destaca informações de contato (por exemplo, um botão/link para conversar via WhatsApp com o responsável).

Carrinho de compras: funcionalidade para adicionar produtos ao carrinho, atualizar quantidades ou remover itens. O carrinho exibe subtotal atualizado em tempo real e é persistido localmente (localStorage) para manter os itens entre sessões.

Checkout completo: fluxo em etapas para finalizar a compra, incluindo:

Formulário de informações pessoais do cliente e endereço de entrega.

Seleção entre entrega ou retirada do pedido. Se o cliente optar por entrega, pode selecionar ou cadastrar um endereço e o sistema calculará o frete e prazo de entrega com base no CEP informado. (Opções de frete são definidas conforme zonas configuradas no admin, podendo incluir frete grátis ou retirada local.)

Campo para cupom de desconto: o cliente pode inserir um código promocional válido para obter desconto no total da compra.

Escolha do método de pagamento: integração inicial com gateway Mercado Pago (pagamento online seguro).

Resumo do pedido exibindo itens, subtotais, desconto de cupom, valor do frete e total final.

Após confirmar, o pedido é enviado ao backend e o cliente é redirecionado para a página de confirmação (ou fluxo de pagamento externo, no caso do Mercado Pago).

Autenticação de usuários: clientes podem se cadastrar com nome, email e senha e fazer login. A sessão do usuário fica persistida (token JWT armazenado em localStorage) para mantê-lo logado. Funcionalidades como checkout exigem que o usuário esteja autenticado. Há também opção de login social (se implementado no backend) ou recuperação de senha (em desenvolvimento).

Kavita News (conteúdo informativo): além da loja, a plataforma oferece uma seção de notícias e informações úteis ao produtor rural, chamada Kavita News. Essa área inclui:

Cotações de mercado: tabela atualizada com preços de commodities agrícolas e moedas relevantes, como café arábica, café robusta, soja, milho, boi gordo e dólar. Para cada ativo, exibe o preço atual, unidade (saca, arroba, etc.), variação diária (em %), mercado de referência e fonte dos dados. O usuário pode clicar em uma cotação para ver detalhes históricos ou informações adicionais.

Clima regional: dados de chuva e clima para cidades da região (Zona da Mata). Mostra a chuva acumulada nas últimas 24 horas e 7 dias para cada local monitorado, com indicação da fonte (estações meteorológicas ou API do clima) e horário da última atualização. Essa funcionalidade permite que produtores acompanhem o índice de chuvas recente em sua região diretamente pelo site.

Notícias e posts do agro: seção de blog/notícias com artigos, dicas e novidades do agronegócio. Os posts incluem título, imagem de capa, resumo e conteúdo completo, podendo ser filtrados por categorias ou tags. Os visitantes podem ler os artigos publicados pela equipe do site, mantendo-se informados sobre tendências e informações importantes.

Obs: A seção Kavita News unifica esses módulos (cotações, clima e notícias) para fornecer informação atualizada e confiável em um só lugar, diretamente no portal. Todo o conteúdo é gerenciado via painel administrativo, garantindo que os dados de mercado e clima estejam sempre atualizados e que novos artigos possam ser publicados facilmente.

Área administrativa (admin)

Autenticação de administrador: acesso protegido por login separado em /admin/login. Apenas usuários admin (definidos no backend) conseguem entrar. Após login bem-sucedido, um token JWT de admin é armazenado em cookie HttpOnly e usado automaticamente nas requisições subsequentes. As rotas administrativas são protegidas – se o token expirar ou for inválido, o admin é redirecionado de volta ao login.

Dashboard geral: visão resumida das entidades principais (quantidade de produtos cadastrados, pedidos recentes, etc. [em implementação]). Serve como página inicial do painel admin, com atalhos para módulos de gestão.

Gerenciamento de produtos: CRUD completo de produtos do e-commerce. O administrador pode cadastrar novos produtos, incluindo nome, descrição, preço, categoria, imagens (upload de fotos do produto) e informações de estoque (quantidade disponível). Há suporte a marcar produtos como em promoção ou destaque na vitrine. Também é possível editar/excluir produtos existentes.

Gerenciamento de serviços: interface para cadastrar e editar os serviços oferecidos pela agropecuária (por exemplo, aluguel de máquinas, consultorias). O admin informa nome do serviço, descrição detalhada, preço ou condições, e pode associar um colaborador ou contato responsável. Esses serviços aparecem na área pública em sua seção própria.

Gerenciamento de pedidos: lista de todos os pedidos realizados na loja, com detalhes de cada pedido (itens, valor, cliente, endereço). O admin pode visualizar e atualizar o status do pedido (ex.: Pendente, Pago, Enviado, Concluído) e editar informações se necessário – por exemplo, adicionar informação de rastreio de entrega ou ajustar itens (em casos de troca ou indisponibilidade). Isso permite o acompanhamento do ciclo de vida de cada venda.

Promoções e campanhas: módulo para criar promoções de marketing. O admin pode selecionar um produto existente e definir uma promoção com desconto (percentual ou valor fixo), estabelecendo preço promocional, tipo da promoção (geral ou flash sale), período de validade e status ativo/inativo. As promoções ativas refletem automaticamente no site público, exibindo o preço original cortado e o preço final com destaque de desconto (por exemplo, “-20% OFF”). Apenas um promo ativo por produto é permitido para evitar conflitos.

Cupons de desconto: ferramenta para gerar códigos promocionais (cupons) que os clientes podem aplicar no checkout. O administrador consegue criar novos cupons definindo código, tipo (desconto em % ou valor fixo), valor do desconto, valor mínimo de pedido para uso, data de expiração e limite de usos. Também é possível ativar/desativar cupons ou removê-los. Esses cupons, quando válidos, serão reconhecidos no carrinho/checkout e aplicarão o abatimento definido no total da compra.

Configurações de frete: módulo para configurar as regras de cálculo de frete. O admin define zonas de entrega por região, incluindo estado e cidades atendidas, e associa um valor de frete e prazo de entrega para cada zona. É possível marcar zonas com frete gratuito e configurar opções de retirada no local. Também pode definir faixas de CEP e regras especiais (por exemplo, frete grátis para determinados produtos ou acima de certo valor, conforme suporte do backend). Essas definições são usadas durante o checkout para cotar o frete: ao informar o CEP, o sistema identifica a zona correspondente e retorna o preço e prazo estimado.

Kavita News (conteúdo): painel específico para gerenciar as informações de clima, cotações e posts do blog que aparecem na área pública. Neste módulo, o administrador pode:

Atualizar clima: cadastrar locais (cidades/estações) a serem acompanhados, ajustando coordenadas ou códigos necessários, e inserir manualmente ou sincronizar os dados de chuva (mm de precipitação). O sistema suporta integração com a API Open-Meteo e dados de estações meteorológicas, permitindo atualização automática dos valores de chuva diária e semanal.

Atualizar cotações: inserir ou editar os valores de mercado dos ativos agrícolas. Pode-se atualizar o preço atual de cada commodity (café, soja, milho etc.), sua variação do dia em %, unidade de medida e fonte (por ex. Cepea, Bolsa, etc.). Os emojis e ícones são automaticamente atribuídos conforme o tipo de ativo (ex.: café ☕, milho 🌽, boi 🐂, dólar 💵), tornando a visualização mais amigável.

Gerenciar posts: criar novos artigos de notícia/blog, incluindo título, conteúdo emrich text/Markdown, categoria, tags e imagem de capa. Os posts podem ser salvos como rascunho ou publicados, e a lista de posts permite edição ou exclusão. Assim, a equipe pode alimentar a plataforma com conteúdo relevante ao público-alvo sem necessidade de desenvolvedores.

Todos os formulários da área admin incluem validações e feedback visual. A interface administrativa é construída pensando em usabilidade, com navegação lateral, design responsivo e uso de componentes reutilizáveis (por exemplo, tabelas de dados, modais de confirmação, abas para alternar entre Clima/Cotações/Posts no módulo de conteúdo). Isso garante que mesmo usuários não técnicos consigam gerenciar a plataforma de forma eficiente.

🚀 Como executar o projeto localmente

Nota: Certifique-se de ter o backend da aplicação em execução (veja variável de ambiente abaixo) e de possuir Node.js instalado (versão compatível com Next.js 15).

Clone este repositório e instale as dependências:

git clone https://github.com/rickjs2005/kavita-frontend.git
cd kavita-frontend
npm install


Crie um arquivo .env.local na raiz do projeto definindo a URL da API do backend:

NEXT_PUBLIC_API_URL=http://localhost:5000


Por padrão, o frontend espera que o backend esteja acessível em http://localhost:5000. Ajuste a URL conforme o endereço/porta onde o kavita-backend estiver rodando.

Rode o servidor de desenvolvimento:

npm run dev


O site ficará disponível em http://localhost:3000. Qualquer alteração no código recarregará automaticamente a página (Hot Reloading).

(Opcional) Para gerar uma build de produção otimizada:

npm run build
npm start


Em produção, o app Next.js fará pré-renderização e otimizações de performance automaticamente.

🔒 Autenticação e segurança

Usuários (Clientes): As rotas e funcionalidades públicas podem ser acessadas sem login, porém ações como finalizar compra exigem autenticação. O cliente pode registrar-se diretamente no site (os dados são enviados ao backend) e, após login, recebe um token JWT. Este token é armazenado no localStorage do navegador para manter a sessão. Em cada requisição necessária, o token é incluído nos headers (ou o backend identifica via cookie se for configurado assim) para validar permissões. O front-end possui um contexto de Auth que guarda as informações do usuário logado e fornece métodos para login, logout e registro.

Administradores: O acesso ao painel /admin é protegido. O login de admin envia credenciais a uma rota dedicada do backend e, se válidas, recebe um token JWT HttpOnly cookie (por segurança, não exposto via JS). Esse cookie é automaticamente enviado em chamadas subsequentes às rotas admin (graças a credentials: "include" nas fetch/axios chamadas do front). O front-end administra um contexto AdminAuth para verificar se o admin está logado, e redireciona para /admin/login caso não haja sessão válida. Ao fazer logout, o cookie é invalidado no backend e removido no front. Todas as páginas admin usam esse contexto para impedir acesso não autorizado.

Além disso, o projeto adota boas práticas de segurança no front-end, como sanitização de inputs (principalmente nos formulários admin), uso de HTTPS quando em produção, e proteções contra XSS via React (escape automático de conteúdo inserido). As operações críticas de dados no admin pedem confirmação do usuário (por exemplo, ao deletar um registro) para evitar ações acidentais.

✅ Testes automatizados

O repositório inclui testes escritos em TypeScript utilizando Vitest (framework de teste rápido compatível com Vite) e @testing-library/react (utilitários de teste para componentes React). Os testes cobrem:

Renderização de componentes e comportamento interativo (por ex.: verificar que o componente de cartão de produto exibe informações corretas, ou que botões de adicionar/remover do carrinho funcionam).

Lógica dos hooks e contextos (ex.: teste do CartContext garantindo que adicionar um item atualiza o subtotal corretamente, teste do hook de formulário de checkout verificando validação de CEP, etc.).

Integração básica com serviços utilitários (por ex.: mock do módulo de cálculo de frete para assegurar que determinada entrada de CEP retorna o valor esperado).

Para rodar os testes, utilize o comando:

npm test


Isso executará a suíte completa e fornecerá um relatório no terminal. Para verificar cobertura de código, rode npm run test:coverage (um sumário em texto será exibido, e relatórios detalhados em HTML serão gerados na pasta coverage/). Os testes ajudam a prevenir regressões e a documentar o comportamento esperado das funcionalidades chave do front-end.

📈 Próximos passos e melhorias em desenvolvimento

Este projeto ainda está em desenvolvimento ativo. Algumas funcionalidades e ajustes pendentes que estão no roadmap:

Filtros avançados e busca refinada: adicionar filtros por faixa de preço, classificação (avaliação dos produtos), marca/fabricante etc., para melhorar a experiência de busca e navegação nas listas de produtos.

Wishlist e recomendações: permitir que o cliente marque produtos como favoritos (lista de desejos) e implementar recomendações personalizadas (“quem comprou X também se interessou por Y”) para aumentar engajamento e vendas.

Frete em tempo real por transportadora: integrar cálculo de frete com APIs de transportadoras ou Correios, para obter valores e prazos precisos com base no CEP e peso dos itens (substituindo ou complementando as regras estáticas de zona atuais). Isso tornará o cálculo de entrega mais acurado e possivelmente oferecerá opções expresso/econômica.

Mais gateways de pagamento: além do Mercado Pago, planeja-se incluir outros métodos de pagamento (ex: PagSeguro, PayPal, Pix) para oferecer flexibilidade aos clientes na finalização da compra.

Melhorias de SEO: incluir metatags otimizadas em todas as páginas, dados estruturados (schema.org) para produtos/recetas, sitemap, e otimizações de performance (como lazy loading de imagens não críticas) para melhorar o ranqueamento em buscadores e a experiência geral.

Aprimoramentos na UI/UX: polir detalhes de responsividade, acessibilidade (melhorar navegação por teclado, textos alternativos, contrastes), e talvez implementar um tema escuro para a área pública. Também estão previstos feedbacks mais claros ao usuário (ex.: indicar progresso durante carga de página ou envio de formulário, etc.).

Testes End-to-End: embora já existam testes unitários, pretende-se adicionar testes automatizados de ponta a ponta (E2E) usando ferramentas como Cypress ou Playwright, garantindo que fluxos completos (cadastro, compra, admin CRUD) funcionem corretamente em ambiente real.

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests com melhorias, correções ou novas ideias. Com o Kavita, buscamos unir tecnologia e agronegócio, facilitando tanto o comércio de insumos/produtos quanto o acesso à informação de qualidade para quem vive do campo. Vamos construir isso juntos!

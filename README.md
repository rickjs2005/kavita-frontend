Kavita Frontend

Kavita é uma plataforma de e-commerce voltada para o setor agropecuário, com foco na região da Zona da Mata. Ela permite a venda de produtos agrícolas e contratação de serviços especializados em um só lugar, além de oferecer conteúdo informativo relevante (clima, cotações de mercado, notícias) para produtores rurais. Este repositório contém o código front-end da aplicação, desenvolvido em Next.js (React) com TypeScript e Tailwind CSS, proporcionando uma experiência moderna e responsiva tanto para os clientes quanto para os administradores do sistema.

🛠️ Tecnologias e ferramentas principais

Next.js 15: Framework React com renderização server-side e roteamento baseado em arquivos (App Router) para melhor performance e SEO.

React 19 + TypeScript: Biblioteca de interface com tipagem estática, garantindo manutenibilidade e uso de componentes funcionais modernos.

Tailwind CSS 3: Framework de utilitários CSS para estilização rápida e design responsivo consistente.

Context API & Hooks: Gerenciamento de estado global (autenticação de usuários/admin, carrinho, formulário de checkout) via Context, além de hooks customizados para lógica reutilizável.

React Hook Form + Zod: Criação de formulários com validação schema-first, garantindo entradas de dados seguras e feedback em tempo real.

Axios & Fetch API: Consumo de API RESTful do back-end, com tratamento centralizado de erros e normalização de respostas.

Vitest + Testing Library: Suíte de testes unitários e de componentes para assegurar a qualidade do código (testes cobrem componentes de UI, hooks e contextos).

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
├─ types/                 # Definições TypeScript de tipos e interfaces (Product, Service, etc.)
└─ __tests__/             # Testes automatizados (unitários e integração leve)


✅ Funcionalidades
Área pública (Cliente)

Home: Página inicial destacando categorias de produtos e itens em promoção em formato de carrossel. Apresenta um banner principal e ofertas em destaque para atrair o usuário.

Busca global: Campo de busca que abrange produtos e serviços, retornando resultados filtrados por categoria de forma simultânea para agilizar a localização do que o usuário precisa. Na página de resultados, o usuário pode refinar a busca usando filtros dinâmicos por termo, categoria, faixa de preço e promoções, os quais são processados pelo backend para garantir precisão e performance.

Listagem de produtos: Páginas que exibem os produtos de cada categoria, com filtros por nome, categoria etc. Cada produto mostra nome, imagem, preço e indicação se está em promoção. É possível visualizar a página de detalhes do produto contendo galeria de fotos, descrição, preço original vs. promocional (quando houver promoção), disponibilidade em estoque, avaliações de clientes e até um formulário para o cliente enviar uma avaliação/review do produto. Além disso, usuários logados podem marcar produtos como favoritos (wishlist) clicando no ícone de coração – esses favoritos são persistidos na conta (salvos no backend) e podem ser consultados a qualquer momento na página Meus Favoritos.

Listagem de serviços: Página apresentando os serviços oferecidos (por exemplo, consultoria agrícola, aluguel de máquinas), com imagem ilustrativa, descrição e preço ou condições (se aplicável). Cada serviço destaca informações de contato, incluindo um botão/link para conversar via WhatsApp com o responsável pelo serviço.

Carrinho de compras: Funcionalidade para adicionar produtos ao carrinho, modificar quantidades ou remover itens. O carrinho exibe o subtotal atualizado em tempo real e é persistido localmente (via LocalStorage) para manter os itens entre sessões do usuário.

Checkout completo: Fluxo em etapas para finalizar a compra, incluindo:

Dados e Endereço: Formulário para informações pessoais do cliente e endereço de entrega. O cliente pode cadastrar novos endereços ou selecionar um já salvo.

Entrega ou Retirada: Opção para escolher entre entrega em domicílio ou retirada no local. Se o cliente optar por entrega, ao informar o CEP do endereço o sistema calcula automaticamente o frete e o prazo de entrega com base nas zonas definidas no admin (é possível configurar faixas de CEP ou cidades com diferentes tarifas, incluindo frete grátis para certas regiões). Caso opte por retirada, nenhum frete é acrescentado.

Cupom de desconto: Campo para o cliente aplicar um código promocional válido e obter desconto no total da compra.

Pagamento: Escolha do método de pagamento. Inicialmente, há integração com o gateway Mercado Pago para pagamento online seguro.

Revisão do Pedido: Exibição de um resumo final com itens adicionados, subtotais, desconto do cupom (se aplicado), valor do frete e total geral a pagar.

Confirmação: Ao confirmar a compra, o pedido é enviado ao backend. O cliente é redirecionado para uma página de confirmação do pedido (ou para um fluxo de pagamento externo do Mercado Pago, conforme o caso).

Autenticação de usuários: Clientes podem se registrar no site (informando nome, e-mail e senha) e então fazer login. Após logado, o usuário recebe um token JWT que mantém a sessão ativa (armazenado no localStorage). Funcionalidades como fechar pedido (checkout) exigem que o usuário esteja autenticado; se não estiver, será direcionado ao login. O sistema também suporta (ou planeja suportar) login social (Google, Facebook, etc., se implementado no backend) e possui fluxo de recuperação de senha (em desenvolvimento).

Kavita News: Além da loja, a plataforma oferece uma seção de conteúdo informativo chamada Kavita News, que reúne dados de cotações de mercado, clima regional e notícias/posts do agronegócio, fornecendo informação atualizada e confiável em um só lugar. Todos esses conteúdos são gerenciados via painel admin (veja detalhes no tópico Admin).

Cotações de mercado: tabela atualizada com preços de commodities agrícolas e moedas (café arábica, café robusta, soja, milho, boi gordo, dólar etc.). Para cada ativo, exibe-se o preço atual, unidade de medida (saca, arroba, kg...), variação diária (%) além do mercado de referência e fonte dos dados. O usuário pode clicar em uma cotação para ver detalhes históricos ou informações adicionais.

Clima regional: painel com dados de chuva e clima para cidades da região (Zona da Mata). Mostra a chuva acumulada nas últimas 24 horas e nos últimos 7 dias para cada local monitorado, informando a fonte dos dados (estações meteorológicas locais ou API do clima) e o horário da última atualização. Essa funcionalidade permite que produtores acompanhem facilmente os índices de chuva recentes em sua região diretamente no site.

Notícias e posts: seção de blog/notícias com artigos, dicas e novidades do agronegócio. Os posts incluem título, imagem de capa, resumo e conteúdo completo, podendo ser filtrados por categorias ou tags. Visitantes podem ler os artigos publicados pela equipe do site, mantendo-se informados sobre tendências e informações importantes do setor.

Área administrativa (Admin)

Autenticação de administrador: Acesso ao painel admin em /admin protegido por login. Apenas usuários com perfil de administrador (definidos no backend) conseguem acessar. Após um admin efetuar login com sucesso, um token JWT de administrador é armazenado em um cookie HttpOnly e usado automaticamente nas requisições subsequentes. Todas as rotas/páginas administrativas são protegidas – se o token expirar ou for inválido, o admin é redirecionado de volta para a página de login do admin.

Dashboard geral: Página inicial do painel admin, exibindo um resumo das principais entidades do sistema (por exemplo, quantidade de produtos cadastrados, número de pedidos recentes, etc.) e atalhos para os módulos de gestão. (Obs.: Em desenvolvimento — futuros gráficos e estatísticas poderão ser incluídos nesta visão.)

Gerenciamento de produtos: CRUD completo de produtos do e-commerce. O administrador pode cadastrar novos produtos informando nome, descrição, preço, categoria, imagens (upload de fotos), e dados de estoque (quantidade disponível). É possível marcar produtos como em promoção ou destaque na vitrine da loja. Produtos existentes podem ser editados ou excluídos conforme necessário.

Gerenciamento de serviços: Interface similar para cadastrar e editar os serviços oferecidos pela agropecuária (ex.: aluguel de máquinas, consultorias técnicas). O admin informa nome do serviço, descrição detalhada, preço ou condições, e pode associar um colaborador ou contato responsável. Os serviços cadastrados aparecem na área pública na seção de serviços, permitindo que clientes os consultem e entrem em contato.

Gerenciamento de pedidos: Tela listando todos os pedidos realizados na loja, com detalhes de cada pedido (itens comprados, valores, dados do cliente e endereço de entrega). O admin pode visualizar e atualizar o status do pedido (ex.: Pendente, Pago, Enviado, Concluído) e, se necessário, ajustar informações – por exemplo, adicionar código de rastreamento de entrega ou alterar itens em casos de troca/indisponibilidade. Esse módulo permite acompanhar todo o ciclo de vida de cada venda e garantir um pós-venda eficiente.

Promoções e campanhas: Módulo para criar e gerenciar promoções de marketing. O administrador seleciona um produto existente e define uma promoção com desconto (percentual ou valor fixo), estabelecendo o preço promocional, tipo da promoção (geral ou flash sale), período de validade e status ativo/inativo. Promoções ativas refletem automaticamente na loja pública, exibindo o preço original cortado e o preço final com destaque de desconto (por exemplo, um selo “-20% OFF” no item). O sistema garante que cada produto tenha no máximo uma promoção ativa por vez para evitar conflitos.

Cupons de desconto: Ferramenta para gerar códigos promocionais que os clientes podem aplicar no checkout. O admin pode criar cupons definindo o código, tipo de desconto (percentual ou valor fixo), valor do desconto, valor mínimo de pedido para uso, data de expiração e limite de usos. Também é possível ativar/desativar cupons ou excluí-los. Se o cliente inserir um cupom válido no carrinho/checkout, o sistema aplica automaticamente o abatimento definido no total da compra.

Configurações de frete: Módulo para configurar as regras de cálculo de frete. O administrador define zonas de entrega por região, podendo especificar estados e cidades atendidas, e associa para cada zona um valor de frete e prazo de entrega. É possível marcar determinadas zonas como frete gratuito e configurar opções de retirada local. Também podem ser definidas faixas de CEP para regiões específicas e regras especiais (por exemplo, oferecer frete grátis para determinados produtos ou para pedidos acima de um valor X, conforme suporte do backend). Essas definições são utilizadas durante o checkout: ao informar o CEP, o sistema identifica a zona correspondente e retorna ao cliente o custo de frete e prazo estimado para entrega.

Kavita News (conteúdo): Seção do painel admin dedicada a gerenciar as informações exibidas na área Kavita News do site. Neste módulo, o administrador pode:

Atualizar clima: Cadastrar locais (cidades/estações meteorológicas) a serem acompanhados e inserir manualmente (ou sincronizar automaticamente) os dados de chuva coletados – por exemplo, mm de precipitação diária e semanal. O sistema suporta integração com a API Open-Meteo e outras fontes, permitindo atualizar automaticamente os valores de chuva diária/semanal para cada local configurado.

Atualizar cotações: Inserir ou editar os valores de mercado dos ativos agrícolas. O admin pode atualizar o preço atual de cada commodity (café, soja, milho etc.), sua variação no dia (%), unidade de medida e fonte (por ex.: Cepea, Bolsa B3 etc.). Ícones/emojis ilustrativos são atribuídos conforme o tipo de ativo (ex.: ☕ para café, 🌽 para milho, 🐂 para boi, 💵 para dólar), tornando a visualização mais amigável.

Gerenciar posts: Criar, editar ou excluir artigos de notícia/blog. Ao criar um post, pode-se definir título, conteúdo (suporta texto rico/Markdown), categoria, tags e imagem de capa. Os posts podem ser salvos como rascunho ou publicados imediatamente. A lista de posts no admin permite gerenciamento completo do blog, de forma que a equipe de conteúdo possa publicar novidades sem necessidade de desenvolvedor.

Usabilidade e segurança no admin: Todos os formulários da área admin incluem validações de campos e fornecem feedback visual ao usuário em caso de erro ou sucesso (por exemplo, mensagens de confirmação ou aviso ao salvar alterações). A interface administrativa foi construída com foco em usabilidade, incluindo navegação lateral intuitiva, design responsivo e componentes reutilizáveis (tabelas de dados, modais de confirmação, abas para alternar entre Clima/Cotações/Posts etc.), garantindo que mesmo usuários não técnicos consigam gerenciar a plataforma eficientemente.

🚀 Como executar o projeto localmente

Pré-requisitos: É necessário ter o Node.js instalado (versão compatível com Next.js 15) e um servidor do backend Kavita em funcionamento (veja a variável de ambiente abaixo).

Clone o repositório e instale as dependências:

git clone https://github.com/rickjs2005/kavita-frontend.git
cd kavita-frontend
npm install


Configure as variáveis de ambiente:
Crie um arquivo .env.local na raiz do projeto definindo a URL da API do backend:

NEXT_PUBLIC_API_URL=http://localhost:5000


Ajuste se o backend estiver em outro endereço/porta. Por padrão, o front-end espera o backend em http://localhost:5000 .

Inicie o servidor de desenvolvimento:

npm run dev


O site ficará disponível em http://localhost:3000. Qualquer alteração no código recarregará automaticamente a página (hot reloading).

(Opcional) Gerar build de produção:
Para criar uma versão otimizada e pronta para produção, execute:

npm run build
npm start


Em ambiente de produção, o Next.js fará a pré-renderização das páginas e aplicará otimizações de performance automaticamente.

🔒 Autenticação e segurança

Usuários (clientes): As funcionalidades públicas da plataforma podem ser acessadas sem login; entretanto, ações como finalizar compra exigem autenticação. O cliente pode registrar-se diretamente no site (os dados são enviados ao backend) e, após o login, recebe um token JWT. Este token é armazenado no localStorage do navegador para manter a sessão ativa. Em cada requisição subsequente necessária, o token é enviado nos headers HTTP (ou via cookie, dependendo da configuração do backend) para validação. O front-end possui um AuthContext que guarda as informações do usuário logado e fornece métodos para login, logout e registro.

Administradores: O acesso ao painel /admin é protegido e requer login separado. O admin realiza login em uma rota dedicada; se as credenciais forem válidas, o backend retorna um token JWT de admin em um cookie HttpOnly (por segurança, não acessível via JS). Esse cookie é enviado automaticamente em todas as chamadas subsequentes às rotas admin (graças a credentials: "include" no fetch/Axios do front). O front-end gerencia um AdminAuthContext para verificar se o admin está logado e redireciona para /admin/login caso não haja sessão válida. Ao fazer logout, o cookie é invalidado no backend e removido no front. Todas as páginas do painel usam esse contexto para impedir acesso não autorizado.

Boas práticas de segurança: O projeto adota diversas medidas de segurança no front-end, como sanitização de inputs (principalmente nos formulários do admin) para prevenir XSS, uso obrigatório de HTTPS em produção, e proteção automática do React contra injeção de código malicioso. Operações críticas na área admin (por exemplo, deletar um registro) pedem confirmação explícita do usuário, evitando ações acidentais irreversíveis.

✅ Testes automatizados

O repositório inclui testes escritos em TypeScript utilizando Vitest (framework de teste rápido compatível com Vite) e @testing-library/react (utilitários para testar componentes React). Os testes cobrem uma variedade de cenários importantes, incluindo:

Renderização de componentes e interações de UI: verificando, por exemplo, se um ProductCard exibe as informações corretas e se os botões de adicionar/remover do carrinho funcionam conforme esperado.

Lógica dos hooks e contextos: testes do contexto de carrinho (CartContext) garantindo que adicionar um item atualiza o subtotal corretamente, ou do hook de formulário de checkout verificando a validação de CEP, etc..

Integração com serviços/utilitários: uso de mocks para simular cálculo de frete, assegurando que para um dado CEP o valor retornado corresponde ao esperado, entre outros cenários.

Para rodar a suite de testes, utilize o comando:

npm test


Isso executará todos os testes e exibirá um relatório no terminal. Para gerar um relatório de cobertura de código, rode:

npm run test:coverage


Um resumo será mostrado no terminal, e relatórios detalhados em HTML ficarão disponíveis na pasta coverage/. Manter a cobertura de testes alta ajuda a prevenir regressões e documentar o comportamento esperado das funcionalidades chave do front-end.

📈 Próximos passos e melhorias

Este projeto está em desenvolvimento ativo. Algumas funcionalidades e aprimoramentos técnicos planejados no roadmap incluem:

Filtros adicionais na busca: adicionar filtros por avaliação dos produtos, por marca/fabricante, e possivelmente outros atributos, para refinar ainda mais a experiência de busca e navegação (complementando os filtros já existentes por categoria, preço e promoção).

Recomendações personalizadas: implementar recursos de recomendação de produtos (“quem comprou X também se interessou por Y”), utilizando os dados de navegação e favoritos do cliente para sugerir itens relevantes e aumentar engajamento/vendas.

Frete em tempo real por transportadora: integrar o cálculo de frete com APIs de transportadoras ou dos Correios, obtendo valores e prazos precisos com base no CEP e peso/volume dos itens (substituindo ou complementando as regras estáticas de zona atuais). Isso tornará o cálculo de entrega mais acurado e poderá oferecer opções de frete expresso/econômico ao cliente.

Mais gateways de pagamento: além do Mercado Pago, incluir outros métodos de pagamento (e.g. PagSeguro, PayPal, Pix) para oferecer mais flexibilidade aos clientes na finalização da compra.

Melhorias de SEO: adicionar metatags otimizadas em todas as páginas, dados estruturados (Schema.org) para produtos e posts, um sitemap XML, além de otimizações de performance (como lazy loading de imagens não críticas) para melhorar o ranqueamento em buscadores e a experiência geral do usuário.

Aprimoramentos de UI/UX: polir detalhes de responsividade e acessibilidade (melhorar navegação por teclado, textos alternativos em imagens, contraste de cores), e possivelmente adicionar um tema escuro para a área pública. Também estão previstos feedbacks mais claros durante ações do usuário (por exemplo, indicar progresso enquanto uma página carrega ou um formulário é enviado).

Testes End-to-End: embora já existam testes unitários, planeja-se adicionar testes automatizados de ponta a ponta (E2E) usando ferramentas como Cypress ou Playwright. Esses testes E2E validarão fluxos completos do sistema – cadastro de usuário, realização de compra, operações no admin (CRUD) – em um ambiente simulado próximo do real, garantindo o correto funcionamento de todos os componentes integrados.

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests com sugestões, correções ou novas ideias. Com o Kavita, buscamos unir tecnologia e agronegócio, facilitando tanto o comércio de insumos/produtos quanto o acesso à informação de qualidade para quem vive do campo. Vamos construir isso juntos!

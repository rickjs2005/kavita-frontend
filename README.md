🐮 Kavita Frontend - Interface Web para E-commerce Agropecuário

Este é o frontend da aplicação **Kavita**, um e-commerce completo voltado para produtos e serviços agropecuários. Construído com Next.js, TypeScript e Tailwind CSS, o projeto oferece uma experiência intuitiva para o cliente final e uma área administrativa eficiente.

---

🚀 Tecnologias Utilizadas

- **Next.js**: estrutura React com suporte a SSR e rotas dinâmicas
- **TypeScript**: tipagem estática para maior segurança
- **Tailwind CSS**: framework utilitário para estilização moderna
- **Context API**: controle de autenticação e carrinho de compras
- **React Hook Form + Zod**: validação de formulários
- **Axios**: requisições para a API RESTful

---

📂 Estrutura de Pastas

.
├── components/ # Componentes reutilizáveis
│ ├── admin/ # Formulários, cards e layout do painel admin
│ └── ui/ # Botões, inputs, carrosséis, etc.
├── context/ # Contextos globais (auth, carrinho)
├── hooks/ # Hooks personalizados
├── pages/
│ ├── index.tsx # Página inicial
│ ├── produtos/ # Listagem e detalhes de produtos
│ ├── servicos/ # Página pública de serviços agro
│ ├── admin/ # Área administrativa protegida
│ └── login.tsx # Login e cadastro de usuários
├── public/ # Imagens e arquivos estáticos
└── styles/ # Estilos globais e configs do Tailwind

---

🔐 Autenticação

- **Usuário comum**:
  - Cadastro e login com verificação simples
  - Sessão salva em `localStorage`
- **Administrador**:
  - Login protegido por JWT
  - Token armazenado localmente e verificado nas rotas privadas

---

🛠️ Funcionalidades da Interface

### 👨‍🌾 Área Pública

- **Página Inicial** com:
  - Hero Section (destaque de produto, ex: drones)
  - Produtos por categoria (carrossel)
  - Lista de serviços agropecuários
  - Produtos em destaque
- **Produtos**:
  - Filtro por categoria e subcategoria
  - Página de detalhes com botão "Adicionar ao carrinho"
- **Serviços**:
  - Lista com imagem, descrição, nome do colaborador e WhatsApp
- **Carrinho de compras**:
  - Visualização lateral flutuante
  - Persistência via localStorage
- **Checkout**:
  - Formulário com dados do usuário, endereço e pagamento
- **Cadastro/Login**:
  - Validação com React Hook Form + Zod

### 🛠️ Painel Admin

- **CRUD de produtos**
- **Cadastro de serviços e colaboradores**
- **Controle de destaques**
- **Gerenciamento de pedidos**:
  - Editar status, endereço e itens
- **Filtros e buscas por nome, categoria e subcategoria**

---

🌐 Integração com Backend

- Requisições feitas para: `http://localhost:5000`
- Todas as rotas protegidas exigem token JWT no `Authorization`

---

▶️ Executar localmente

```bash
# Clone o projeto
git clone https://github.com/seu-usuario/kavita-frontend.git
cd kavita-frontend

# Instale as dependências
npm install

# Crie o arquivo .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# Rode o projeto
npm run dev
O site estará disponível em http://localhost:3000.

📌 Requisitos

Node.js instalado

Backend rodando em http://localhost:5000

Variáveis de ambiente configuradas no .env.local

✉️ Contato

Dúvidas ou sugestões? Entre em contato:

Email: suporte@kavita.com
Desenvolvido com ❤️ para o agro brasileiro.

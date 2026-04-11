# Sistema de Cores — Design Tokens

## Onde ficam as cores

| Camada | Arquivo | Papel |
|--------|---------|-------|
| **CSS Custom Properties** | `src/app/globals.css` (`:root`) | Fonte unica de verdade. Todos os valores hex ficam aqui. |
| **Tailwind Config** | `tailwind.config.ts` (`theme.extend.colors`) | Mapeia cada CSS var para um nome Tailwind semantico. |
| **Componentes** | `src/components/`, `src/app/` | Consomem via classes Tailwind (`bg-primary`, `text-accent`) ou `var(--color-*)` em inline styles. |

## Como usar uma cor

### Em classes Tailwind (preferido)

```tsx
<button className="bg-primary hover:bg-primary-hover text-white">
  Salvar
</button>

<span className="text-accent">R$ 199,90</span>

<div className="bg-dark-750 border-dark-600">...</div>
```

### Em inline styles / props de bibliotecas (Recharts, SVG, etc.)

```tsx
<Bar fill="var(--color-chart-primary)" />
<CartesianGrid stroke="var(--color-chart-grid)" />
<svg stroke="var(--color-accent-bright)">...</svg>
```

### Em objetos JavaScript dinâmicos

```tsx
const CARD_COLORS = {
  vendas: "var(--color-success)",
  estoque: "var(--color-alert)",
};
// Passar como style={{ color: CARD_COLORS.vendas }}
```

## Como adicionar uma nova cor

1. Adicione a CSS var em `src/app/globals.css` dentro de `:root`:
   ```css
   --color-novo-token: #hexvalue;
   ```

2. Mapeie em `tailwind.config.ts` dentro de `theme.extend.colors`:
   ```ts
   "novo-token": "var(--color-novo-token)",
   ```

3. Use nos componentes:
   ```tsx
   className="bg-novo-token"
   // ou
   style={{ color: "var(--color-novo-token)" }}
   ```

## Catalogo de tokens

### Brand (cores principais da marca)

| Token | Classe Tailwind | Hex | Uso |
|-------|----------------|-----|-----|
| `primary` | `bg-primary`, `text-primary` | `#359293` | Botoes primarios, focus, headings |
| `primary-hover` | `hover:bg-primary-hover` | `#2b797a` | Hover de primary |
| `secondary` | `bg-secondary`, `text-secondary` | `#2F7E7F` | Botoes secundarios, badges, servicos |
| `secondary-hover` | `hover:bg-secondary-hover` | `#256567` | Hover de secondary |
| `accent` | `bg-accent`, `text-accent` | `#EC5B20` | CTAs, carrinho, destaques |
| `accent-hover` | `hover:bg-accent-hover` | `#d44c19` | Hover de accent |
| `accent-bright` | via `var()` | `#FF7A00` | Icone de busca |

### Surfaces (fundos e areas)

| Token | Hex | Uso |
|-------|-----|-----|
| `header` | `#083E46` | Top bar, footer, textos dark |
| `nav` | `#038284` | Barra de navegacao desktop |
| `surface-light` | `#FFF7F2` | Background destaque leve (checkout) |
| `surface-gradient-start` | `#F7FBFA` | Inicio de gradiente claro |

### Teal variants

| Token | Hex | Uso |
|-------|-----|-----|
| `teal-light` | `#35c2c4` | Charts admin, tabs, relatorios |
| `teal-dark` | `#0f5e63` | Textos escuros, links |
| `teal-text-light` | `#cffafe` | Texto claro sobre superficies teal/dark (ex: chip "valido ate" da promo) |

### Social brands

| Token | Hex | Uso |
|-------|-----|-----|
| `whatsapp` | `#25D366` | Botoes/icones do WhatsApp (cor oficial da marca) |
| `whatsapp-hover` | `#20bd5a` | Hover do botao WhatsApp |

### Info / Sky

| Token | Hex | Uso |
|-------|-----|-----|
| `info` | `#38bdf8` | Indicadores informativos, cupons |
| `info-hover` | `#0ea5e9` | Hover de info |
| `info-dark` | `#0284C7` | Texto info em fundo claro |

### Dark backgrounds

| Token | Hex | Uso |
|-------|-----|-----|
| `dark-900` | `#070A0E` | Fundo mais escuro (drones) |
| `dark-850` | `#0A0F14` | Overlay escuro |
| `dark-800` | `#050816` | Relatorios admin |
| `dark-750` | `#020617` | Cards escuros, cupons |
| `dark-700` | `#0b1120` | Paineis admin |
| `dark-600` | `#0f172a` | Bordas escuras |

### Status

| Token | Hex | Uso |
|-------|-----|-----|
| `success` / `success-dark` | `#22c55e` / `#16A34A` | Sucesso, ativo |
| `warning` | `#eab308` | Pendente, atencao |
| `alert` | `#f97316` | Alerta, estoque baixo |
| `purple` | `#a855f7` | Especial (servicos, futuro) |

### Charts (Recharts / graficos)

| Token | Hex | Uso |
|-------|-----|-----|
| `chart-bg` | `#ffffff` | Fundo de tooltip |
| `chart-text` | `#020617` | Texto de tooltip |
| `chart-primary` | `#35c2c4` | Barra principal (teal) |
| `chart-bar-success` | `#22c55e` | Barra de vendas (verde) |
| `chart-grid` | `#1e293b` | Linhas de grid |
| `chart-tick` | `#9ca3af` | Labels de eixo |
| `chart-tick-light` | `#cbd5f5` | Labels de eixo (fundo escuro) |
| `chart-axis` | `#1f2937` | Linhas de eixo |
| `chart-border` | `#e5e7eb` | Borda de tooltip |

### Gradientes (paginas tematicas)

| Token | Hex | Pagina |
|-------|-----|--------|
| `service-from/via/to` | `#041a24`/`#053a3f`/`#021117` | /servicos |
| `career-via` | `#0b4f56` | /trabalhe-conosco |
| `drone-from/to` | `#0b1220`/`#070b13` | /drones |

### Admin login

| Token | Hex | Uso |
|-------|-----|-----|
| `admin-login` | `#2b7c7c` | Background botao |
| `admin-login-hover` | `#256f6f` | Hover |
| `admin-login-accent` | `#39a2a2` | Texto, focus ring |

## O que NAO fazer

- **Nunca** usar hex direto em classes Tailwind: `bg-[#359293]` → use `bg-primary`
- **Nunca** criar uma cor em um componente sem antes adicionar em `globals.css` + `tailwind.config.ts`
- **Nunca** duplicar um valor hex que ja existe como token — busque o token correspondente
- **Nunca** usar `fetch` para buscar cores — cores sao estaticas, definidas em build time
- Cores de Tailwind padrao (gray, red, slate, white, black) continuam sendo usadas normalmente para UI neutra. Tokens sao para **cores da marca e do tema**.

## Exceções aceitas

- **Shadows com rgba** (ex: `shadow-[0_10px_30px_rgba(0,0,0,0.6)]`) — valores compostos, nao tokenizaveis
- **Patterns decorativos** (ex: `radial-gradient(#ffffff33 1px, ...)`) — efeitos visuais isolados
- **Cores Tailwind padrao** para neutros: `text-gray-600`, `bg-white`, `border-slate-800` — nao precisam de token

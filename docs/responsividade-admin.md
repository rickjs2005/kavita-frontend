# Responsividade do painel admin — guia operacional

> Tornar o painel admin do Kavita responsivo de raiz, com componentes
> compartilhados, em vez de corrigir overflow página por página.

## Por que este documento existe

A demo de mai/2026 expôs overflow horizontal recorrente em telas mobile
(~390px) em múltiplas páginas admin (mercado-do-café, drones e
suspeitas em outras). Auditoria identificou três causas:

1. **Header de página re-implementado em cada tela.** Algumas telas
   seguiam o padrão correto (`/admin/produtos`, `/admin/pedidos`),
   outras não (`/admin/mercado-do-cafe` usou `flex shrink-0`
   horizontal com 5 ações que não comprimem).

2. **Grid de KPIs reescrito em cada tela**, com breakpoints
   inconsistentes (`grid-cols-2 sm:grid-cols-4 lg:grid-cols-7` num
   módulo, `sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` em outro).

3. **Regra global em `globals.css`** força `min-height: 44px;
   min-width: 44px` em `a`, `button`, `select`, etc. quando
   `pointer: coarse` (WCAG 2.5.5). Isso significa que **ícones-only não
   conseguem encolher abaixo de 44×44 no mobile** — confiar em texto
   escondido (`hidden sm:inline`) sem prever wrap/stack do grupo gera
   overflow garantido.

Solução: extrair o padrão correto em componentes compartilhados.
Páginas novas usam o componente; páginas legadas migram quando o bug
for visível.

---

## Componentes compartilhados

Localização: `src/components/admin/shell/`

### `<AdminPageHeader>`

Header padronizado para topo de página admin. Mobile-first: stack
vertical abaixo de `sm`, lado a lado em `sm+`.

```tsx
import AdminPageHeader from "@/components/admin/shell/AdminPageHeader";

<AdminPageHeader
  kicker="Admin"                            // opcional, uppercase pequeno
  title="Mercado do Café"
  subtitle="Gerencie corretoras..."         // opcional
  badges={<Badge>Kavita Admin</Badge>}      // opcional, antes do título
  actions={                                 // opcional, ações secundárias
    <>
      <Link>📈 Métricas</Link>
      <Link>💳 Reconciliação</Link>
    </>
  }
  primaryAction={                           // opcional, CTA principal
    <Link className="bg-emerald-600 ...">+ Nova Corretora</Link>
  }
/>
```

Comportamento mobile-first:
- Title block + actions empilham verticalmente abaixo de `sm`.
- `actions` envolvem com `flex-wrap` — itens nunca causam overflow horizontal.
- `primaryAction` recebe `w-full` automaticamente abaixo de `sm` via
  `[&>*]:w-full sm:[&>*]:w-auto` no wrapper.

Quando NÃO usar:
- Header com lógica de navegação complexa (breadcrumb dinâmico,
  estado interno). Aí use as primitives diretamente.

### `<KpiGrid>`

Wrapper de grid para KPIs. Duas variantes cobrem 95% dos casos.

```tsx
import KpiGrid from "@/components/admin/shell/KpiGrid";

// 3-4 KPIs (drones, produtos, pedidos)
<KpiGrid>
  <KpiCard ... />
  <KpiCard ... />
</KpiGrid>

// 5+ KPIs (dashboard regional)
<KpiGrid variant="wide">
  {cards.map(c => <KpiCard ... />)}
</KpiGrid>
```

Breakpoints:
| Variant | Mobile | sm | lg | xl |
|---|---|---|---|---|
| `default` (3-4 KPIs) | 1 col | 2 cols | 4 cols | 4 cols |
| `wide` (5+ KPIs) | 2 cols | 3 cols | 4 cols | 7 cols |

---

## Padrões obrigatórios para telas admin novas

Use esta lista como checklist antes do PR.

1. **Header**: `<AdminPageHeader>`. Não escreva `<header className="flex...">` à mão.
2. **KPIs**: `<KpiGrid>`. Não declare seu próprio `grid-cols-*`.
3. **Linhas de filtros/ações** (busca + filtros + botões):
   `flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`.
4. **Tabelas**: nunca usar `<table>` puro no mobile. Padrão é
   `<div className="hidden md:table">` para desktop + `<div className="md:hidden">`
   com cards mobile (ver `CorretorasTable`, `PostsTable`).
5. **Tabs/abas**: usar `<AdminModuleTabs>` (já existe) OU pills com
   `flex flex-wrap gap-2`. Para muitas abas, usar
   `flex gap-2 overflow-x-auto -mx-1 px-1 sm:flex-wrap sm:overflow-visible`
   (padrão do `DronesTabs`).
6. **Botão primário no mobile**: full-width via `primaryAction` do header
   ou `w-full sm:w-auto` direto na classe.
7. **NUNCA** confie em `hidden sm:inline` no texto sem prever wrap do
   grupo. A regra `pointer: coarse` força 44×44px em cada `<a>/<button>`,
   e ícones-only não compactam.

---

## Checklist de QA mobile

Use ao validar uma tela admin nova ou ao fechar bug de responsividade.

### Viewports obrigatórios

Testar em DevTools (Responsive Mode) ou device real.

- [ ] **320px** — iPhone SE (1ª gen), Android entry-level
- [ ] **375px** — iPhone SE (2ª/3ª gen)
- [ ] **390px** — iPhone 12/13/14 (largura mais comum hoje)
- [ ] **768px** — iPad portrait, breakpoint `md`
- [ ] **1024px** — iPad landscape / desktop pequeno, breakpoint `lg`

### Itens a verificar em cada viewport

- [ ] Sem **scroll horizontal** na página inteira (não apenas em containers internos com `overflow-x-auto` deliberado).
- [ ] **Header**: título não trunca além do `truncate` esperado; ações primária/secundárias todas visíveis e clicáveis.
- [ ] **KPIs**: todos os cards renderizam dentro do viewport, valores numéricos legíveis (não cortados).
- [ ] **Botões**: nenhum botão com texto cortado por `overflow: hidden` do parent.
- [ ] **Áreas tocáveis** ≥ 44×44px (regra global já aplica, mas verificar visualmente).
- [ ] **Tabs**: se `overflow-x-auto`, indicar com gradient/scroll cue.
- [ ] **Tabelas**: layout em cards no mobile; tabela completa apenas em `md+`.
- [ ] **Modais**: largura máxima respeitada; sem overflow horizontal interno.
- [ ] **Formulários**: campos full-width no mobile; labels legíveis.

### Salvaguarda global

`<main>` do admin tem `overflow-x-clip` (commit `25a339d`). Isso evita
scrollbar horizontal aparecendo enquanto um bug é investigado, **mas
não esconde bugs**: o elemento ofensivo continua visível em DevTools
(Inspect Element mostra que ele se estende além do viewport e está
sendo recortado). NÃO use `overflow-x-clip` como solução — investigue
sempre a causa raiz.

---

## Fase 11 e além

Telas que já estão planejadas para Fase 11 (Asaas Split, NFPe, painel
admin de contratos) **devem nascer responsivas** usando os componentes
acima. O custo marginal é zero: importar `AdminPageHeader` em vez de
escrever `<header>` à mão.

Quando aparecer um caso que `AdminPageHeader` não cobre, **estenda o
componente** (adicione prop nova, mantenha defaults) em vez de
escapar para markup inline.

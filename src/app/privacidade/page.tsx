// src/app/privacidade/page.tsx
//
// Política de Privacidade + canal do DPO. Página pública, indexável
// (LGPD exige transparência).

import type { Metadata } from "next";
import { PrivacyContactForm } from "./PrivacyContactForm";

export const metadata: Metadata = {
  title: "Privacidade · Kavita",
  description:
    "Como o Kavita trata seus dados pessoais, seus direitos como titular e canal direto do Encarregado de Dados (DPO).",
};

const PRIVACY_EMAIL =
  process.env.NEXT_PUBLIC_PRIVACY_EMAIL ?? "privacidade@kavita.com.br";

// Versão da política — bumpar quando o texto relevante mudar para
// reexigir aceite. Não exportado aqui porque Next.js restringe
// exports em `page.tsx`; se precisar reutilizar em outro módulo,
// mover para `src/lib/privacyVersion.ts`.
const PRIVACY_POLICY_VERSION = "2026-04-20.1";

export default function PrivacidadePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <header className="border-b border-stone-200 pb-6 mb-10">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
          Kavita · Mercado do Café
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
          Política de Privacidade
        </h1>
        <p className="mt-3 text-sm text-stone-500">
          Versão {PRIVACY_POLICY_VERSION} · Última atualização: 20 de abril
          de 2026
        </p>
      </header>

      <div className="prose prose-stone max-w-none space-y-8 text-stone-700">
        <section>
          <h2 className="text-xl font-semibold text-stone-900">Em resumo</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              Coletamos só o necessário para o Kavita funcionar — conta,
              contato, informações do seu café.
            </li>
            <li>
              Você é dono dos seus dados. Pode baixar, corrigir ou pedir
              exclusão a qualquer momento pelo painel.
            </li>
            <li>
              Não vendemos seus dados. Compartilhamos apenas com provedores
              essenciais (assinatura digital, e-mail, pagamento) sob
              contratos de proteção.
            </li>
            <li>
              Usamos criptografia, controle de acesso por papel e auditoria
              de toda ação administrativa.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-stone-900">
            Quais dados coletamos
          </h2>
          <h3 className="mt-4 text-base font-semibold text-stone-800">
            Dados da conta
          </h3>
          <p className="mt-1 text-sm">
            E-mail (obrigatório para login), nome, cidade, telefone. Você
            decide o que preencher além do e-mail.
          </p>
          <h3 className="mt-4 text-base font-semibold text-stone-800">
            Dados de contato com corretora
          </h3>
          <p className="mt-1 text-sm">
            Quando você envia um formulário a uma corretora, gravamos nome,
            telefone, e-mail, cidade, mensagem e sua descrição do café.
            Esses dados são compartilhados com a corretora que você
            escolheu — e somente com ela.
          </p>
          <h3 className="mt-4 text-base font-semibold text-stone-800">
            Dados de contrato
          </h3>
          <p className="mt-1 text-sm">
            Quando um contrato é gerado, seu nome e e-mail são enviados ao
            provedor de assinatura digital (ClickSign) para vincular você
            à assinatura. O contrato assinado fica arquivado.
          </p>
          <h3 className="mt-4 text-base font-semibold text-stone-800">
            Dados técnicos
          </h3>
          <p className="mt-1 text-sm">
            IP, user-agent e data/hora de acesso — usados para segurança,
            prevenção de fraude e anti-spam. Apagados após 90 dias.
          </p>
          <h3 className="mt-4 text-base font-semibold text-stone-800">
            Cookies
          </h3>
          <p className="mt-1 text-sm">
            Usamos apenas <strong>cookies necessários</strong>: sessão (login),
            CSRF (segurança) e preferência de cookies. Sem analytics de
            terceiros, sem remarketing, sem cookies opcionais no momento.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-stone-900">
            Para que usamos
          </h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm">
            <li>Manter sua conta ativa e autenticar você com segurança.</li>
            <li>
              Conectar você à corretora que você escolheu via formulário de
              contato.
            </li>
            <li>
              Emitir e registrar contratos com validade jurídica via
              ClickSign.
            </li>
            <li>Avisar sobre atualizações operacionais da sua conta.</li>
            <li>
              Prevenir fraude e abuso (rate limit, Turnstile anti-bot).
            </li>
            <li>
              Cumprir obrigações fiscais e regulatórias (art. 16 I LGPD).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-stone-900">
            Bases legais que usamos
          </h2>
          <p className="mt-2 text-sm">
            Cada tratamento tem uma base legal específica do art. 7º da LGPD:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm">
            <li>
              <strong>Consentimento</strong> — captura de lead, opt-in de
              SMS/alertas. Você pode revogar a qualquer momento.
            </li>
            <li>
              <strong>Execução de contrato</strong> — autenticação, emissão
              de contratos, notificações transacionais.
            </li>
            <li>
              <strong>Obrigação legal</strong> — retenção de notas fiscais e
              dados tributários por 5 anos.
            </li>
            <li>
              <strong>Legítimo interesse</strong> — prevenção de fraude,
              métricas internas de SLA.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-stone-900">
            Com quem compartilhamos
          </h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm">
            <li>
              <strong>ClickSign</strong> — assinatura digital (nome + e-mail)
            </li>
            <li>
              <strong>Asaas</strong> — pagamento de plano da corretora (não
              do produtor)
            </li>
            <li>
              <strong>Cloudflare Turnstile</strong> — proteção anti-bot (sem
              vínculo com a conta)
            </li>
            <li>
              <strong>Provedor de e-mail transacional</strong> — envio de
              magic link e notificações
            </li>
            <li>
              <strong>Sentry</strong> — monitoramento de erro técnico (sem
              body de requisição)
            </li>
          </ul>
          <p className="mt-2 text-sm">
            Cada parceiro opera sob contrato com cláusulas de proteção de
            dados. Não vendemos dados para fins de marketing de terceiros.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-stone-900">
            Por quanto tempo guardamos
          </h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm">
            <li>
              Conta ativa: enquanto você usar. Inativa por 12 meses:
              e-mail de reativação e desativação gradual.
            </li>
            <li>
              Conta excluída a seu pedido: 30 dias de janela de
              arrependimento; depois disso, seus dados de identificação
              são anonimizados.
            </li>
            <li>
              Pedidos e notas fiscais: 5 anos (obrigação tributária).
            </li>
            <li>
              Solicitações de privacidade: 5 anos (auditoria ANPD).
            </li>
            <li>
              Logs técnicos (IP, user-agent): 90 dias, depois apagados.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-stone-900">
            Seus direitos (art. 18 LGPD)
          </h2>
          <p className="mt-2 text-sm">
            Se você tem conta, o caminho mais rápido é o{" "}
            <a
              href="/painel/produtor/meus-dados"
              className="text-amber-700 hover:underline font-semibold"
            >
              painel Meus Dados
            </a>
            , onde você pode:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
            <li>Ver tudo o que guardamos sobre você</li>
            <li>Baixar uma cópia em JSON (portabilidade)</li>
            <li>Pedir correção pelo perfil</li>
            <li>Pedir exclusão da conta</li>
          </ul>
          <p className="mt-3 text-sm">
            Se prefere falar com o nosso Encarregado, use o formulário
            abaixo ou escreva diretamente para{" "}
            <a
              href={`mailto:${PRIVACY_EMAIL}`}
              className="text-amber-700 hover:underline"
            >
              {PRIVACY_EMAIL}
            </a>
            . Respondemos em até 15 dias.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-stone-900">Segurança</h2>
          <p className="mt-2 text-sm">
            Usamos HTTPS ponta-a-ponta, senhas em bcrypt, CPF criptografado
            AES-256-GCM, controle de acesso por papel, CSRF double-submit,
            rate limit nas rotas públicas, auditoria de ações
            administrativas, e 2FA opcional para corretoras.
          </p>
          <p className="mt-2 text-sm">
            Em caso de incidente com risco ou dano relevante aos titulares,
            comunicaremos a ANPD e os titulares afetados conforme a LGPD
            (art. 48) e a regulamentação vigente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-stone-900">
            Contato do Encarregado (DPO)
          </h2>
          <p className="mt-2 text-sm">
            <strong>E-mail:</strong>{" "}
            <a
              href={`mailto:${PRIVACY_EMAIL}`}
              className="text-amber-700 hover:underline"
            >
              {PRIVACY_EMAIL}
            </a>
          </p>
          <p className="mt-2 text-sm">
            Ou use o formulário abaixo — ele cai direto no nosso canal de
            privacidade com SLA interno de 10 dias úteis.
          </p>
        </section>

        <section className="rounded-2xl bg-stone-50 border border-stone-200 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-stone-900">
            Falar com privacidade
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Pedidos de acesso, correção, exclusão, portabilidade ou relato
            de incidente.
          </p>
          <div className="mt-6">
            <PrivacyContactForm />
          </div>
        </section>
      </div>
    </main>
  );
}

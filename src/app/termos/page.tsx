// src/app/termos/page.tsx
//
// Termos de Uso — RSC com texto estático versionado.
// Mantenha sincronizado com kavita-backend/docs/legal/termos-de-uso-vX.Y.Z.md
// e atualize lib/legal/versions.js (TERMS_VERSION) quando publicar nova versão.

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso — Kavita",
  description:
    "Termos de Uso da plataforma Kavita: cadastro, marketplace, mercado do café, drones e responsabilidades.",
};

const VERSION = "1.0.0";
const VIGENCIA = "08/05/2026";

export default function TermosPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Documento legal
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          Termos de Uso
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Versão {VERSION} · Vigência a partir de {VIGENCIA}
        </p>
      </header>

      {/* Banner discreto avisando sobre a fase preliminar — alinhado com
          o aviso correspondente em kavita-backend/docs/legal/termos-de-uso-v1.0.0.md.
          Mantém aparência profissional sem placeholders visíveis tipo
          [CNPJ] que indiquem documento inacabado. */}
      <aside className="mb-10 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900">
        <strong className="font-semibold">Aviso — versão preliminar.</strong>{" "}
        Este documento está em vigor enquanto a Kavita opera em fase de
        validação controlada. Os dados institucionais completos (razão
        social, CNPJ, endereço fiscal e foro) serão divulgados nesta mesma
        página antes do início da operação comercial definitiva, com aviso
        prévio aos titulares e nova versão. As cláusulas de proteção,
        segurança e direitos do titular vigoram desde já.
      </aside>

      <article className="prose prose-stone max-w-none prose-headings:font-extrabold prose-h2:mt-8 prose-h2:text-xl prose-h2:tracking-tight prose-a:text-emerald-700 prose-a:underline-offset-2">
        <h2>1. Quem somos</h2>
        <p>
          <strong>Kavita</strong> é o nome fantasia da plataforma vertical
          para o agro brasileiro, com sede operacional em{" "}
          <strong>Manhuaçu, Minas Gerais</strong>. Disponibiliza:
        </p>
        <ul>
          <li>
            <strong>Marketplace Agro</strong> — loja de produtos e serviços
          </li>
          <li>
            <strong>Mercado do Café</strong> — marketplace e SaaS para
            corretoras de café
          </li>
          <li>
            <strong>Kavita Drones</strong> — captação de leads para revenda
            DJI Agras
          </li>
          <li>
            <strong>Kavita News</strong> — canal editorial
          </li>
        </ul>
        <p>
          Para falar com a gente, escreva para{" "}
          <a href="mailto:suporte@kavita.com.br">suporte@kavita.com.br</a>{" "}
          ou pelo canal disponível em <Link href="/contato">/contato</Link>.
        </p>

        <h2>2. O que estes Termos cobrem</h2>
        <p>Estes Termos regem o uso da plataforma Kavita por:</p>
        <ul>
          <li>
            <strong>Cliente da loja</strong> — pessoa física que compra
            produtos e serviços no Marketplace Agro.
          </li>
          <li>
            <strong>Corretora de café</strong> — pessoa jurídica cadastrada no
            Mercado do Café para receber leads e gerir contratos.
          </li>
          <li>
            <strong>Produtor rural</strong> — pessoa física que envia lead a
            uma corretora ou interage com sua área logada.
          </li>
          <li>
            <strong>Visitante</strong> — qualquer pessoa que use serviços
            públicos sem cadastro.
          </li>
        </ul>
        <p>
          A{" "}
          <Link href="/privacidade">Política de Privacidade</Link> é parte
          integrante destes Termos.
        </p>

        <h2>3. Cadastro e responsabilidades do usuário</h2>
        <p>Ao se cadastrar, você declara que:</p>
        <ul>
          <li>Os dados informados são verdadeiros, atuais e de sua titularidade.</li>
          <li>Tem capacidade legal para contratar (18+ anos ou pessoa jurídica válida).</li>
          <li>Vai manter a senha em sigilo e responde por todo uso da conta.</li>
        </ul>
        <p>
          A Kavita pode suspender ou encerrar contas com indícios de fraude,
          dados falsos ou violação destes Termos, comunicando o motivo quando
          legalmente possível.
        </p>

        <h2>4. Mercado do Café — papel da Kavita</h2>
        <p>
          A Kavita é uma <strong>plataforma intermediadora</strong> entre
          produtor e corretora de café. <strong>A Kavita não é parte na
          relação comercial</strong> entre produtor e corretora — quem
          negocia, precifica, recebe o produto e paga é a corretora cadastrada.
        </p>
        <p>Para corretoras, a Kavita oferece:</p>
        <ul>
          <li>Listagem pública na vitrine do Mercado do Café.</li>
          <li>Recebimento de leads de produtores via formulário público.</li>
          <li>
            Painel privado com CRM, contratos digitais (ClickSign), KYC/AML e
            ticker CEPEA.
          </li>
          <li>
            Planos pagos (Pro / Max) com cobrança recorrente via Asaas; plano
            Free gratuito.
          </li>
          <li>Cancelamento de plano a qualquer momento, sem multa de fidelidade.</li>
        </ul>
        <p>
          Para o produtor, a Kavita oferece o canal de envio de lead.{" "}
          <strong>
            A qualidade da resposta, do preço e do atendimento depende da
            corretora
          </strong>
          , não da Kavita.
        </p>

        <h2>5. Marketplace Agro</h2>
        <p>
          O Marketplace Agro é uma loja virtual de produtos e serviços
          operada pela Kavita. Direitos de devolução, troca e arrependimento
          seguem o <strong>Código de Defesa do Consumidor</strong>. Pagamento
          via Mercado Pago (cartão, Pix, boleto). Frete por zona conforme
          calculado no checkout.
        </p>

        <h2>6. Kavita Drones</h2>
        <p>
          A landing <code>/drones</code> é uma vitrine institucional de drones
          DJI Agras. <strong>A Kavita atua como representante autorizado</strong>{" "}
          e o contato comercial é redirecionado para um representante regional
          via WhatsApp. <strong>A venda final do equipamento é fechada com o
          representante</strong>, não com a Kavita diretamente.
        </p>
        <p>
          Ao enviar o formulário de interesse, você autoriza a Kavita a
          compartilhar seu nome, telefone e cidade com o representante regional,
          exclusivamente para retorno comercial.
        </p>

        <h2>7. Conteúdo gerado pelo usuário</h2>
        <p>
          Comentários, avaliações e mídias (fotos, vídeos) passam por
          <strong> moderação prévia</strong>. A Kavita pode recusar conteúdo
          que viole direitos de terceiros, seja ofensivo, discriminatório,
          ilícito ou sem relação com o produto/serviço avaliado.
        </p>
        <p>
          Você concede à Kavita licença não-exclusiva para exibir o conteúdo
          aprovado nas páginas pertinentes. Pode pedir remoção a qualquer
          momento — exclusão em até 30 dias.
        </p>

        <h2>8. Propriedade intelectual</h2>
        <p>
          Marca, layout, código-fonte e bases de dados da Kavita são
          protegidos. Uso comercial sem autorização (scraping, redistribuição,
          framing) é proibido.
        </p>

        <h2>9. Disponibilidade do serviço</h2>
        <p>
          A Kavita se esforça para manter a plataforma disponível 24/7, mas pode
          haver janelas programadas de manutenção, indisponibilidade por causas
          externas (provedor, gateway, internet) ou incidente de segurança. A
          Kavita não responde por prejuízos decorrentes de indisponibilidade
          não-causada por culpa própria, no limite permitido em lei.
        </p>

        <h2>10. Cancelamento e exclusão de conta</h2>
        <p>A qualquer momento, você pode:</p>
        <ul>
          <li>
            Cancelar plano pago da corretora pelo painel{" "}
            <code>/painel/corretora/planos</code>.
          </li>
          <li>
            Solicitar exclusão de conta enviando e-mail para{" "}
            <a href="mailto:dpo@kavita.com.br">dpo@kavita.com.br</a>.
          </li>
          <li>
            Excluir lead enviado a corretora pela página{" "}
            <code>/meus-dados</code> ou pela própria corretora.
          </li>
        </ul>
        <p>
          A exclusão é irreversível para dados pessoais (LGPD); dados
          estritamente necessários para obrigação legal (notas fiscais,
          prestação de contas a gateways) são preservados pelo prazo legal.
        </p>

        <h2>11. Mudanças destes Termos</h2>
        <p>
          A Kavita pode atualizar estes Termos. Mudanças materiais são
          comunicadas por e-mail ou banner com 15 dias de antecedência.
          Continuar usando a plataforma após a data de vigência da nova
          versão equivale a aceitar a atualização.
        </p>

        <h2>12. Foro e legislação aplicável</h2>
        <p>
          Estes Termos são regidos pelas leis brasileiras. Enquanto a Kavita
          opera em fase de validação controlada, o foro de eleição é a{" "}
          <strong>
            comarca da sede operacional da Kavita em Minas Gerais
          </strong>
          , ressalvada a competência do consumidor prevista no Código de
          Defesa do Consumidor (foro do domicílio do consumidor). A
          indicação definitiva da comarca será divulgada nesta mesma página
          antes do início da operação comercial definitiva.
        </p>
      </article>

      <footer className="mt-12 border-t border-stone-200 pt-6 text-xs text-stone-500">
        <p>
          Última atualização: {VIGENCIA}. Versão {VERSION}. Em caso de dúvidas,
          escreva para <a href="mailto:dpo@kavita.com.br" className="text-emerald-700 underline">dpo@kavita.com.br</a>.
        </p>
      </footer>
    </main>
  );
}

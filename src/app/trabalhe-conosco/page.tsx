import Link from "next/link";

const bullets = [
  "Veterinários(as) de grandes e pequenos animais",
  "Agrônomos(as) e consultores de lavoura",
  "Mecânicos de máquinas e implementos agrícolas",
  "Técnicos em inseminação e reprodução",
  "Aplicadores de defensivos, adubação e manejo",
  "Prestadores de serviços rurais em geral",
];

const benefits = [
  {
    title: "Mais clientes da sua região",
    desc: "Produtores e fazendas te encontram pelo tipo de serviço, especialidade e localização.",
  },
  {
    title: "Perfil profissional completo",
    desc: "Fotos, especialidade, descrição, avaliações e contatos tudo em um só lugar.",
  },
  {
    title: "Foco no agro",
    desc: "Nada de serviço genérico de cidade. A plataforma é pensada para a realidade do campo.",
  },
  {
    title: "Contato direto",
    desc: "O produtor fala com você por WhatsApp ou solicita orçamento direto pela plataforma.",
  },
];

const steps = [
  {
    tag: "Passo 1",
    title: "Preencha seus dados",
    desc: "Nos envie seus dados básicos, especialidade e região de atendimento.",
  },
  {
    tag: "Passo 2",
    title: "Validação do cadastro",
    desc: "Nossa equipe faz uma checagem simples para manter a qualidade da rede.",
  },
  {
    tag: "Passo 3",
    title: "Seu perfil vai ao ar",
    desc: "Seu serviço passa a aparecer na página de Serviços da Kavita.",
  },
  {
    tag: "Passo 4",
    title: "Comece a receber contatos",
    desc: "Produtores podem te chamar no WhatsApp ou enviar pedidos de orçamento.",
  },
];

const faqs = [
  {
    q: "Tem custo para me cadastrar?",
    a: "No momento, o cadastro para parceiros está gratuito. Em breve poderão existir planos com benefícios extras, mas sempre com transparência.",
  },
  {
    q: "Preciso de CNPJ para trabalhar com a Kavita?",
    a: "Não é obrigatório ter CNPJ, mas é importante atuar de forma regularizada na sua área. Se tiver MEI ou empresa, melhor ainda.",
  },
  {
    q: "Posso atender mais de uma cidade?",
    a: "Sim. No cadastro você pode informar as regiões onde tem costume de atender.",
  },
  {
    q: "A Kavita fica com parte do valor do serviço?",
    a: "Por enquanto, a Kavita funciona como vitrine e conexão entre produtor e prestador. O combinado de valores é feito diretamente entre vocês.",
  },
];

export default function TrabalheConoscoPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* HERO */}
      <section className="bg-gradient-to-b from-[#083E46] via-[#0b4f56] to-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16 md:flex-row md:items-center">
          {/* Texto */}
          <div className="flex-1 space-y-5">
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/40">
              Rede de serviços do campo • Kavita
            </span>
            <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
              Trabalhe com a{" "}
              <span className="text-emerald-300">Kavita</span> e seja
              referência na sua região.
            </h1>
            <p className="max-w-xl text-sm text-emerald-50/90 sm:text-base">
              Se você é veterinário, agrônomo, mecânico de máquinas ou presta
              qualquer tipo de serviço rural, a Kavita ajuda produtores da sua
              região a te encontrarem com facilidade e confiança.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/trabalhe-conosco/cadastro"
                className="inline-flex items-center justify-center rounded-full bg-[#2F7E7F] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-[#256567]"
              >
                Quero me cadastrar
              </Link>
              <Link
                href="/servicos"
                className="inline-flex items-center justify-center rounded-full border border-emerald-300/40 px-6 py-2.5 text-sm font-medium text-emerald-100 hover:border-emerald-200 hover:bg-emerald-500/10"
              >
                Ver profissionais já cadastrados
              </Link>
            </div>

            <p className="pt-1 text-xs text-emerald-100/80">
              Cadastro sujeito a análise simples para manter a qualidade da
              rede de serviços.
            </p>
          </div>

          {/* Bloco lateral */}
          <div className="mt-6 w-full max-w-md flex-1 md:mt-0 md:max-w-sm">
            <div className="overflow-hidden rounded-3xl bg-slate-900/80 p-5 shadow-2xl ring-1 ring-emerald-500/20 backdrop-blur">
              <p className="text-sm font-semibold text-emerald-200">
                Quem pode se cadastrar?
              </p>
              <p className="mt-1 text-xs text-emerald-50/80">
                Profissionais e empresas que prestam serviços diretamente para
                o produtor rural.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-gray-100">
                {bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 rounded-xl bg-slate-800/70 px-3 py-2"
                  >
                    <span className="mt-[2px] text-emerald-300">●</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] text-emerald-100/70">
                Mesmo que seu trabalho não esteja na lista, se você atua no
                campo, pode mandar seu cadastro que avaliamos com carinho.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="border-t border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <header className="max-w-2xl pb-6">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Por que entrar na rede de serviços da Kavita?
            </h2>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Nosso foco é aproximar produtores de profissionais sérios e
              apaixonados pelo agro. Quanto mais organizado o serviço, melhor
              para todo mundo.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm transition hover:border-emerald-400/50"
              >
                <div>
                  <h3 className="text-sm font-semibold text-emerald-200 sm:text-base">
                    {b.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-200 sm:text-sm">
                    {b.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <header className="max-w-2xl pb-6">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Como funciona na prática?
            </h2>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              A ideia é simples: o produtor te encontra pela Kavita, vocês
              conversam e combinam o serviço da forma que fizer mais sentido
              para ambos.
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-4">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
              >
                <div className="mb-2 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-200 ring-1 ring-emerald-500/30">
                  {s.tag}
                </div>
                <h3 className="text-sm font-semibold text-white sm:text-base">
                  {i + 1}. {s.title}
                </h3>
                <p className="mt-2 text-xs text-slate-200 sm:text-sm">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-50 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
            <p>
              Quer acelerar? Você já pode mandar seus dados agora mesmo pelo
              formulário de contato. Nossa equipe entra em contato para finalizar
              seu cadastro.
            </p>
            <Link
              href="/trabalhe-conosco/cadastro"
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-md hover:bg-emerald-400"
            >
              Enviar meus dados
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <header className="max-w-2xl pb-6">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Dúvidas frequentes
            </h2>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Se ainda ficou alguma dúvida, você pode falar com a gente pelo
              WhatsApp ou pelo formulário de contato.
            </p>
          </header>

          <div className="space-y-4">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
              >
                <p className="text-sm font-semibold text-emerald-200 sm:text-base">
                  {f.q}
                </p>
                <p className="mt-1 text-xs text-slate-200 sm:text-sm">{f.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-slate-900/80 p-4 text-xs text-slate-200 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
            <p>
              Prefere falar direto com alguém da equipe da Kavita? Estamos à
              disposição para tirar dúvidas e orientar seu cadastro.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://wa.me/5531999999999"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-[#2F7E7F] px-5 py-2 text-xs font-semibold text-white hover:bg-[#256567]"
              >
                Falar no WhatsApp
              </a>
              <Link
                href="/contato?tipo=prestador"
                className="inline-flex items-center justify-center rounded-full border border-slate-500 px-5 py-2 text-xs font-semibold text-slate-100 hover:border-emerald-400"
              >
                Enviar mensagem
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

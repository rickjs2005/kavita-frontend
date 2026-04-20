// src/components/verificar/CertificadoNotFound.tsx
//
// Tela alternativa quando o token QR não corresponde a nenhum contrato.
// Mesmo design language de certificado, mas selo "NÃO ENCONTRADO".

export function CertificadoNotFound() {
  return (
    <main className="min-h-screen bg-[#f7f3e9] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <article
          className="relative bg-white shadow-xl shadow-stone-900/10 ring-1 ring-stone-200 rounded-sm overflow-hidden"
          style={{ fontFamily: "Georgia, 'Times New Roman', Times, serif" }}
        >
          <div className="border-b-2 border-[#2e5734] px-10 pt-10 pb-6 text-center">
            <div className="text-xs tracking-[0.4em] text-[#2e5734] font-semibold">
              KAVITA · MERCADO DO CAFÉ
            </div>
            <div className="mt-1 text-[11px] tracking-[0.2em] uppercase text-stone-500">
              Certificado de Autenticidade
            </div>
          </div>

          <div className="px-10 py-16">
            <div className="flex justify-center">
              <div className="inline-flex flex-col items-center justify-center w-44 h-44 rounded-full bg-red-50 ring-4 ring-red-600 ring-offset-4 ring-offset-white text-center px-4">
                <div className="text-xs tracking-[0.3em] text-red-700">
                  STATUS
                </div>
                <div className="mt-1 text-xl font-bold tracking-wider text-red-700">
                  NÃO ENCONTRADO
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-stone-700 max-w-lg mx-auto">
              Não localizamos nenhum contrato associado a este código de
              verificação. Isso pode acontecer se o link foi digitado
              incorretamente, se o contrato foi removido, ou se o QR Code
              pertence a outra plataforma.
            </p>
            <p className="mt-4 text-center text-xs text-stone-500 max-w-lg mx-auto italic">
              Se você escaneou o QR do rodapé de um PDF impresso e chegou aqui,
              procure a corretora responsável pelo documento — ela pode
              reemitir o link de verificação.
            </p>
          </div>

          <footer className="border-t-2 border-[#2e5734] px-10 py-5 text-center text-[10px] tracking-[0.2em] text-stone-500 uppercase">
            Plataforma Kavita
          </footer>
        </article>
      </div>
    </main>
  );
}

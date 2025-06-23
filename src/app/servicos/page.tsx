"use client"; // Garante que este componente será renderizado no lado do cliente (navegador)

import { useFetchServicos } from "@/hooks/useFetchServicos"; // Hook personalizado que busca os serviços da API

// Componente principal da página pública de serviços
export default function ServicosUsuarioPage() {
  // Busca os serviços e o estado de carregamento/erro
  const { servicos, loading, error } = useFetchServicos();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Título principal */}
      <h1 className="text-3xl font-bold mb-8 text-center text-green-700">
        Nossos Serviços
      </h1>

      {/* Verifica o estado da requisição */}
      {loading ? (
        // Se ainda estiver carregando os dados
        <p className="text-center">Carregando serviços...</p>
      ) : error ? (
        // Se houve erro ao buscar os serviços
        <p className="text-center text-red-500">{error}</p>
      ) : servicos.length === 0 ? (
        // Se a lista de serviços estiver vazia
        <p className="text-center">Nenhum serviço disponível no momento.</p>
      ) : (
        // Exibe os serviços em um grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicos.map((servico) => (
            <div
              key={servico.id} // Chave única para o React
              className="bg-white rounded-xl shadow hover:shadow-md transition p-4 border border-gray-100"
            >
              {/* Imagem do serviço */}
              <img
                src={servico.imagem}
                alt={servico.nome}
                className="w-full h-48 object-cover rounded mb-3"
              />

              {/* Nome do serviço */}
              <h2 className="text-lg font-semibold text-gray-800">
                {servico.nome}
              </h2>

              {/* Cargo do colaborador que presta o serviço */}
              <p className="text-gray-600 text-sm mb-1">{servico.cargo}</p>

              {/* Descrição do serviço */}
              <p className="text-gray-500 text-sm mb-2">{servico.descricao}</p>

              {/* Especialidade do colaborador */}
              <p className="text-sm text-gray-400 mb-1">
                Especialidade: {servico.especialidade_nome}
              </p>

              {/* Link para falar com o colaborador via WhatsApp */}
              <a
                href={`https://wa.me/${servico.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-2 text-green-600 text-sm hover:underline"
              >
                Falar no WhatsApp
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// Este componente renderiza uma lista de serviços disponíveis para o usuário
// utilizando um grid responsivo. Ele exibe informações como nome do serviço, cargo do colaborador,
// descrição, especialidade e um link para contato via WhatsApp.
// O estado de carregamento e possíveis erros são tratados para melhorar a experiência do usuário.
// O hook useFetchServicos é responsável por buscar os dados da API e gerenciar o estado de carregamento e erro.
// A página é estilizada com Tailwind CSS para um layout moderno e responsivo.
// A estrutura do grid se adapta a diferentes tamanhos de tela, garantindo uma boa usabilidade em dispositivos móveis e desktops.
// A imagem do serviço é exibida com um efeito de hover que aumenta a sombra, destacando o serviço selecionado.
// O link para o WhatsApp abre em uma nova aba, permitindo que o usuário inicie uma conversa com o colaborador responsável pelo serviço de forma rápida e fácil.
// A tipagem do TypeScript garante que os dados recebidos estejam corretos, evitando erros de runtime e melhorando a manutenção do código.
// O uso de "use client" no início do arquivo indica que este componente deve ser renderizado no lado do cliente (navegador),
// permitindo interações dinâmicas como o carregamento de dados e a navegação para o WhatsApp.
// O componente é exportado como padrão, permitindo que seja importado e utilizado em outras partes da aplicação.
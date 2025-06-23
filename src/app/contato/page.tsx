'use client'; // Esse componente deve ser renderizado no lado do cliente (navegador), não no servidor

import { useState } from 'react'; // Hook do React para criar e atualizar estados
import topics from '../../data/topics'; // Importa os tópicos (dados de ajuda/suporte) a serem exibidos
import Form from '../../components/layout/form'; // Importa o formulário de atendimento

// Define o tipo de dado para um tópico (ajuda o TypeScript a identificar os campos que cada tópico deve ter)
type Topic = {
  title: string; // Título do tópico (ex: "Pagamento", "Entrega")
  description: string; // Pequena descrição do tópico
  content?: string[]; // Texto com mais detalhes (opcional), geralmente em forma de parágrafos
};

const AtendimentoPage = () => {
  // Estado para armazenar o tópico que o usuário selecionou (ou null se nenhum foi clicado)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-6">
        {/* Título e frase de destaque da página */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#359293]">
            Aqui tem tudo sobre a Kavita! 🌿
          </h1>
          <p className="text-xl text-gray-600">Líder em preço e qualidade</p>
        </div>

        {/* Se nenhum tópico foi selecionado, exibe os cards com os tópicos */}
        {!selectedTopic && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {topics.map((topic: Topic) => (
              <div
                key={topic.title}
                className="bg-white shadow-md rounded-lg p-6 text-center hover:shadow-lg hover:scale-105 transition cursor-pointer"
                onClick={() => setSelectedTopic(topic.title)} // Quando clicar no card, define o tópico como selecionado
              >
                <h2 className="text-lg font-semibold text-[#359293]">{topic.title}</h2>
                <p className="text-sm text-gray-600 mt-2">{topic.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Se um tópico foi selecionado, mostra seu conteúdo detalhado */}
        {selectedTopic && (
          <div className="bg-white shadow-md rounded-lg p-6">
            {/* Botão para voltar para a lista de tópicos */}
            <button
              onClick={() => setSelectedTopic(null)} // Reseta o estado para voltar à tela anterior
              className="mb-4 text-[#EC5B20] hover:underline"
            >
              ← Voltar
            </button>

            {/* Título do tópico selecionado */}
            <h2 className="text-2xl font-bold text-[#359293] mb-4">{selectedTopic}</h2>

            {/* Conteúdo do tópico, se existir */}
            <div className="text-gray-700 space-y-4">
              {
                // Procura o tópico selecionado no array de tópicos e mostra seu conteúdo (parágrafos)
                topics
                  .find((topic) => topic.title === selectedTopic)
                  ?.content?.map((paragraph, index) => (
                    <p key={index} className="text-gray-700">
                      {paragraph}
                    </p>
                  )) || <p>Informações não disponíveis.</p> // Se não houver conteúdo, mostra uma mensagem alternativa
              }
            </div>
          </div>
        )}

        {/* Se nenhum tópico estiver selecionado, mostra o formulário de contato */}
        {!selectedTopic && <Form />}
      </div>
    </main>
  );
};

export default AtendimentoPage;
// Exporta o componente para ser usado na aplicação
// O componente é a página de atendimento ao cliente, onde os usuários podem ver tópicos de ajuda e enviar mensagens
// Ele usa o estado para controlar qual tópico está sendo visualizado e renderiza os dados dinamicamente
// A página é responsiva e se adapta a diferentes tamanhos de tela, usando classes do Tailwind CSS
// O formulário de contato é exibido na parte inferior da página, permitindo que os usuários enviem mensagens
// A estrutura do código é organizada para facilitar a leitura e manutenção, seguindo boas práticas de desenvolvimento
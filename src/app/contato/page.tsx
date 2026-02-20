'use client';

import { useState } from 'react';
import topics from '../../data/topics';
import Form from '../../components/layout/form';

type Topic = {
  title: string;
  description: string;
  content?: string[];
};

const AtendimentoPage = () => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#359293]">
            Aqui tem tudo sobre a Kavita! 🌿
          </h1>
          <p className="text-xl text-gray-600">Líder em preço e qualidade</p>
        </div>

        {!selectedTopic && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {topics.map((topic: Topic) => (
              <button
                key={topic.title}
                type="button"
                onClick={() => setSelectedTopic(topic.title)}
                className="bg-white shadow-md rounded-lg p-6 text-center hover:shadow-lg hover:scale-105 transition cursor-pointer w-full"
              >
                <h2 className="text-lg font-semibold text-[#359293]">{topic.title}</h2>
                <p className="text-sm text-gray-600 mt-2">{topic.description}</p>
              </button>
            ))}
          </div>
        )}

        {selectedTopic && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <button
              type="button"
              onClick={() => setSelectedTopic(null)}
              className="mb-4 text-[#EC5B20] hover:underline"
            >
              ← Voltar
            </button>

            <h2 className="text-2xl font-bold text-[#359293] mb-4">{selectedTopic}</h2>

            <div className="text-gray-700 space-y-4">
              {topics
                .find((topic) => topic.title === selectedTopic)
                ?.content?.map((paragraph, index) => (
                  <p key={index} className="text-gray-700">
                    {paragraph}
                  </p>
                )) || <p>Informações não disponíveis.</p>}
            </div>
          </div>
        )}

        {!selectedTopic && <Form />}
      </div>
    </main>
  );
};

export default AtendimentoPage;
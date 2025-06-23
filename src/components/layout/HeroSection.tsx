'use client'; // Indica que este componente será renderizado no lado do cliente

import { useState } from "react";
import Link from "next/link";

const HeroSection = () => {
  // Estado para detectar erro ao carregar o vídeo
  const [videoError, setVideoError] = useState(false);

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
      {/* 🎥 Vídeo de fundo: será exibido se não houver erro */}
      {!videoError && (
        <video
          className="absolute top-0 left-0 w-full h-full object-cover"
          src="/videos/drone2.mp4"   // Caminho do vídeo
          autoPlay                   // Reproduz automaticamente
          loop                       // Reproduz em loop
          muted                      // Sem som
          playsInline                // Reproduz dentro do elemento (para mobile)
          onError={() => setVideoError(true)} // Se der erro, ativa o fallback
        />
      )}

      {/* 🖼️ Imagem de fallback caso o vídeo não funcione */}
      {videoError && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/drone/fallback-hero1.jpg')" }}
        />
      )}

      {/* Camada escura para aumentar o contraste do texto */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* Texto e botão sobre o vídeo */}
      <div className="relative z-10 text-center text-white px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Revolucione sua Gestão Agrícola
        </h1>

        <p className="text-lg md:text-2xl mb-8">
          Conheça a tecnologia que otimiza o monitoramento e a eficiência no campo.
        </p>

        {/* Botão de ação "Saiba mais" */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link
            href="/drones"
            className="bg-transparent border border-[#359293] text-white px-8 py-3 rounded-md hover:bg-[#359293] transition-all duration-300"
          >
            Saiba Mais
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
// O componente HeroSection renderiza uma seção de destaque com um vídeo de fundo
// Se o vídeo falhar, exibe uma imagem de fallback
'use client';

import { useState } from "react";
import Link from "next/link";

const HeroSection = () => {
  const [videoError, setVideoError] = useState(false);

  return (
    <section className="relative w-full min-h-[70vh] sm:min-h-screen flex items-center justify-center overflow-hidden">
      {!videoError && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/videos/drone2.mp4"
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoError(true)}
        />
      )}

      {videoError && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/drone/fallback-hero1.jpg')" }}
        />
      )}

      <div className="absolute inset-0 bg-black/60"></div>

      <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 py-12 sm:py-0">
        <h1 className="text-3xl md:text-6xl font-bold mb-3 md:mb-4 leading-tight">
          Revolucione sua Gestão Agrícola
        </h1>

        <p className="text-base md:text-2xl mb-6 md:mb-8 max-w-3xl mx-auto">
          Conheça a tecnologia que otimiza o monitoramento e a eficiência no campo.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            href="/drones"
            className="inline-flex items-center justify-center bg-transparent border border-[#359293] text-white px-6 md:px-8 py-2.5 md:py-3 rounded-md hover:bg-[#359293] transition-all duration-300"
          >
            Saiba Mais
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

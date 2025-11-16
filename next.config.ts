// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Para dev é comum alternar entre localhost e IP da rede
    remotePatterns: [
      { protocol: "http", hostname: "localhost",    port: "5000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1",    port: "5000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "172.20.10.9",  port: "5000", pathname: "/uploads/**" }, // ajuste se seu IP mudar
      // se você também usa 192.168.x.x no Wi-Fi, adicione mais uma linha:
      // { protocol: "http", hostname: "192.168.0.15", port: "5000", pathname: "/uploads/**" },
    ],
    // opcional: durante DEV, evita otimização (útil pra testar rapidamente)
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;

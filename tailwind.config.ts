import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── Tipografia: tokens "kvt" para o módulo Drones ─────────────
      // Padroniza os ~22 tamanhos arbitrários espalhados (text-[10px],
      // text-[11px], text-[12.5px]...) numa escala única consumida via
      // text-eyebrow / text-meta / text-body-sm / text-display etc.
      // Tailwind padrão (text-xs/sm/base/lg/xl/2xl/3xl/4xl/5xl/6xl/7xl)
      // continua disponível — os tokens só somam.
      fontSize: {
        eyebrow: ["11px", { lineHeight: "1.2", letterSpacing: "0.22em" }],
        meta: ["12px", { lineHeight: "1.4" }],
        "body-sm": ["13px", { lineHeight: "1.55" }],
        // Hero display: cap mobile em 30px, sobe progressivamente até
        // 60px no desktop. Use via classes responsivas se quiser pular
        // breakpoints (text-display sm:text-4xl md:text-5xl ...).
        display: ["1.875rem", { lineHeight: "1.05", letterSpacing: "-0.01em" }],
      },
      letterSpacing: {
        "kvt-eyebrow": "0.22em",
        "kvt-wide": "0.18em",
        "kvt-mono": "0.12em",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",

        /* Brand */
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          hover: "var(--color-secondary-hover)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          bright: "var(--color-accent-bright)",
        },

        /* Surfaces */
        header: "var(--color-header)",
        nav: "var(--color-nav)",
        "surface-light": "var(--color-surface-light)",
        "surface-gradient-start": "var(--color-surface-gradient-start)",

        /* Teal variants */
        "teal-light": "var(--color-teal-light)",
        "teal-dark": "var(--color-teal-dark)",
        "teal-text-light": "var(--color-teal-text-light)",

        /* Social brands */
        whatsapp: {
          DEFAULT: "var(--color-whatsapp)",
          hover: "var(--color-whatsapp-hover)",
        },

        /* Info / Sky */
        info: {
          DEFAULT: "var(--color-info)",
          hover: "var(--color-info-hover)",
          dark: "var(--color-info-dark)",
        },

        /* Dark backgrounds */
        dark: {
          900: "var(--color-dark-900)",
          850: "var(--color-dark-850)",
          800: "var(--color-dark-800)",
          750: "var(--color-dark-750)",
          700: "var(--color-dark-700)",
          600: "var(--color-dark-600)",
        },

        /* Status */
        success: {
          DEFAULT: "var(--color-success)",
          dark: "var(--color-success-dark)",
        },
        warning: "var(--color-warning)",
        alert: "var(--color-alert)",
        purple: "var(--color-purple)",

        /* Gradients: Services */
        service: {
          from: "var(--color-service-from)",
          via: "var(--color-service-via)",
          to: "var(--color-service-to)",
        },

        /* Gradients: Career */
        career: {
          via: "var(--color-career-via)",
        },

        /* Gradients: Drones */
        drone: {
          from: "var(--color-drone-from)",
          to: "var(--color-drone-to)",
        },

        /* Admin login */
        "admin-login": {
          DEFAULT: "var(--color-admin-login)",
          hover: "var(--color-admin-login-hover)",
          accent: "var(--color-admin-login-accent)",
        },

        /* Charts */
        chart: {
          bg: "var(--color-chart-bg)",
          text: "var(--color-chart-text)",
          primary: "var(--color-chart-primary)",
          grid: "var(--color-chart-grid)",
          tick: "var(--color-chart-tick)",
          "tick-light": "var(--color-chart-tick-light)",
          axis: "var(--color-chart-axis)",
          border: "var(--color-chart-border)",
          "bar-success": "var(--color-chart-bar-success)",
        },

        /* Painel corretora — gradiente warm */
        "panel-warm-via": "var(--color-panel-warm-via)",

        /* Certificado de verificação (público) */
        "certificate-bg": "var(--color-certificate-bg)",
        "certificate-accent": "var(--color-certificate-accent)",
      },
    },
  },
  plugins: [],
} satisfies Config;

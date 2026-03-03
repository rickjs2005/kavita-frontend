// src/services/api/endpoints.ts
// Centralized constants for all API endpoint paths.
// Import from here instead of hardcoding strings in pages/hooks.

export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/api/login",
    LOGOUT: "/api/logout",
    ME: "/api/users/me",
    REGISTER: "/api/users/register",
    FORGOT_PASSWORD: "/api/users/forgot-password",
    RESET_PASSWORD: "/api/users/reset-password",
  },

  // Users
  USERS: {
    ME: "/api/users/me",
    ADDRESSES: "/api/users/addresses",
    ADDRESS: (id: number | string) => `/api/users/addresses/${id}`,
  },

  // Products
  PRODUCTS: {
    LIST: "/api/products",
    DETAIL: (id: number | string) => `/api/products/${id}`,
    PROMOTIONS: (id: number | string) => `/api/public/promocoes/${id}`,
  },

  // Services (serviços)
  SERVICES: {
    LIST: "/api/servicos",
    DETAIL: (id: number | string) => `/api/servicos/${id}`,
    PUBLIC_LIST: "/api/public/servicos",
  },

  // Favorites
  FAVORITES: {
    LIST: "/api/favorites",
    TOGGLE: (id: number | string) => `/api/favorites/${id}`,
  },

  // Checkout
  CHECKOUT: {
    PLACE_ORDER: "/api/checkout",
    PREVIEW_COUPON: "/api/checkout/preview-cupom",
  },

  // Shipping
  SHIPPING: {
    QUOTE: "/api/shipping/quote",
  },

  // Payment
  PAYMENT: {
    START: "/api/payment/start",
  },
} as const;

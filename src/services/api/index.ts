// src/services/api/index.ts
// Central export point for all API services.
// Import from here for a clean, unified API surface.

export { ENDPOINTS } from "./endpoints";

export * as authService from "./services/auth";
export * as usersService from "./services/users";
export * as addressesService from "./services/addresses";
export * as productsService from "./services/products";

/**
 * Global API and Backend URL configuration loaded from root .env.
 * Accesses VITE_API_BASE_URL or VITE_BACKEND_URL defined in the root .env file.
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || '';

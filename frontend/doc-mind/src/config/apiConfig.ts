/**
 * Global API and Backend URL configuration loaded from root .env or runtime environment.
 * When empty (''), API requests use relative paths routed through Nginx reverse proxy.
 */
export const API_BASE_URL: string =
    import.meta.env.VITE_API_BASE_URL ?? import.meta.env.API_BASE_URL ?? import.meta.env.BACKEND_URL ?? '';

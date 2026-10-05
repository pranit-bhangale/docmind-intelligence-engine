/**
 * Global API and Backend URL configuration loaded from root .env.
 * Accesses API_BASE_URL or BACKEND_URL defined in the root .env file.
 */
export const API_BASE_URL: string =
    import.meta.env.API_BASE_URL || import.meta.env.BACKEND_URL || '';

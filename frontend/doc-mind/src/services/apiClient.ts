const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface RequestOptions extends RequestInit {
  tenantId?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { tenantId, params, headers: customHeaders, ...fetchOptions } = options;

  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Version': 'v1',
    ...(customHeaders as Record<string, string>),
  };

  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Send and receive HttpOnly cookies
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && typeof errorData === 'object') {
        errorMessage = errorData.message || errorData.error || errorMessage;
      }
    } catch {
      // JSON parsing failed, keep default statusText error
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content or empty response body
  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

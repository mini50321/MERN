const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  return response;
}

export async function apiGet<T = any>(endpoint: string): Promise<T> {
  const response = await apiRequest(endpoint, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function apiPost<T = any>(endpoint: string, data?: any): Promise<T> {
  const response = await apiRequest(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || `API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function apiPut<T = any>(endpoint: string, data?: any): Promise<T> {
  const response = await apiRequest(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || `API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  const response = await apiRequest(endpoint, { method: 'DELETE' });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || `API Error: ${response.statusText}`);
  }
  return response.json();
}

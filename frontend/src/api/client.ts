const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export type RequestOptions = Omit<RequestInit, 'body'> & { body?: object };

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, ...rest } = options;
  const url = path.startsWith('http') ? path : `${BASE_URL.replace(/\/$/, '')}${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };

  const res = await fetch(url, {
    ...rest,
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = (data as { error?: string })?.error ?? res.statusText;
    throw new Error(message);
  }

  return data as T;
}

/** Request with FormData (e.g. file uploads). Do not set Content-Type; browser sets multipart boundary. */
export async function requestFormData<T>(path: string, formData: FormData, method = 'POST'): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE_URL.replace(/\/$/, '')}${path}`;

  const res = await fetch(url, {
    method,
    credentials: 'include',
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = (data as { error?: string })?.error ?? res.statusText;
    throw new Error(message);
  }

  return data as T;
}

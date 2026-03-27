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

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = (data as { error?: string })?.error ?? res.statusText;
    throw new Error(message);
  }

  return data as T;
}

/** Multipart form upload (e.g. images). Do not set Content-Type; browser sets boundary. */
export async function requestMultipart<T>(path: string, formData: FormData): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE_URL.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, {
    method: 'POST',
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

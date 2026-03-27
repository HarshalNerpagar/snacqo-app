import { request } from './client';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

export interface AdminLoginResponse {
  user: AdminUser;
}

/**
 * Admin login (email + password). Token is set in HttpOnly cookie by the backend.
 */
export function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  return request<AdminLoginResponse>('/auth/admin-login', {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), password },
  });
}

export function getMe(): Promise<{ user: AdminUser }> {
  return request('/auth/me');
}

/** Clear session (HttpOnly cookie) on the server. */
export function logout(): Promise<void> {
  return request('/auth/logout', { method: 'POST' }).then(() => undefined);
}

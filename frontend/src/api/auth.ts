import { request } from './client';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  userName: string;
  role: string;
}

export interface VerifyOtpResponse {
  user: AuthUser;
}

/** intent: 'login' = only send if user exists; 'signup' = only send if user does not exist */
export function sendOtp(email: string, intent?: 'login' | 'signup'): Promise<{ message: string }> {
  return request('/auth/send-otp', {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), ...(intent && { intent }) },
  });
}

export function verifyOtp(params: {
  email: string;
  otp: string;
  firstName?: string;
  lastName?: string;
}): Promise<VerifyOtpResponse> {
  const { email, otp, firstName, lastName } = params;
  return request<VerifyOtpResponse>('/auth/verify-otp', {
    method: 'POST',
    body: {
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
    },
  });
}

export function getMe(): Promise<{ user: AuthUser }> {
  return request('/auth/me');
}

/** Clear session (HttpOnly cookie) on the server. */
export function logout(): Promise<void> {
  return request('/auth/logout', { method: 'POST' }).then(() => undefined);
}

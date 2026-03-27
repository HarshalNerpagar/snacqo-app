import { request } from './client';

export interface SettingsResponse {
  allowMultipleCoupons: boolean;
}

export function getSettings(): Promise<SettingsResponse> {
  return request<SettingsResponse>('/admin/settings');
}

export function updateSettings(body: { allowMultipleCoupons: boolean }): Promise<SettingsResponse> {
  return request<SettingsResponse>('/admin/settings', { method: 'PATCH', body });
}

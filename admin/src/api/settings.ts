import { request } from './client';

export interface ShippingSettings {
  freeThresholdPaise: number;
  lowThresholdPaise: number;
  chargeBelowLowPaise: number;
  chargeAboveLowPaise: number;
}

export interface SettingsResponse {
  allowMultipleCoupons: boolean;
  shipping: ShippingSettings;
}

export function getSettings(): Promise<SettingsResponse> {
  return request<SettingsResponse>('/admin/settings');
}

export function updateSettings(body: {
  allowMultipleCoupons?: boolean;
  shipping?: Partial<ShippingSettings>;
}): Promise<SettingsResponse> {
  return request<SettingsResponse>('/admin/settings', { method: 'PATCH', body });
}

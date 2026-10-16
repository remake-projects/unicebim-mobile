import 'expo-sqlite/localStorage/install';

import { useSyncExternalStore } from 'react';

/** Preferences of this device (not synced to the account); reset when the user signs out. */
export type DeviceSettings = {
  /** Ask for Face ID / fingerprint / device passcode when the app opens. */
  appLock: boolean;
  /** Local reminders for payments, renewals and the income day. */
  reminders: boolean;
};

const DEFAULTS: DeviceSettings = { appLock: false, reminders: false };
const KEY = 'unicebim.deviceSettings';

let current: DeviceSettings | null = null;
const listeners = new Set<() => void>();

function read(): DeviceSettings {
  if (!current) {
    try {
      current = { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<DeviceSettings>) };
    } catch {
      current = { ...DEFAULTS };
    }
  }
  return current;
}

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDeviceSettings(): DeviceSettings {
  return read();
}

export function setDeviceSetting<K extends keyof DeviceSettings>(key: K, value: DeviceSettings[K]): void {
  current = { ...read(), [key]: value };
  localStorage.setItem(KEY, JSON.stringify(current));
  emit();
}

export function resetDeviceSettings(): void {
  current = { ...DEFAULTS };
  localStorage.removeItem(KEY);
  emit();
}

export function useDeviceSettings(): DeviceSettings {
  return useSyncExternalStore(subscribe, read);
}

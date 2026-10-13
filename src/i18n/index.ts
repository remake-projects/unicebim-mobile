import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { getDeviceRegion } from '@/lib/region';
import en from './locales/en';
import tr from './locales/tr';

export const SUPPORTED_LANGUAGES = ['tr', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const resources = { tr: { translation: tr }, en: { translation: en } } as const;

export function resolveLanguage(languageOrLocale: string | null | undefined): Language {
  const code = (languageOrLocale ?? '').slice(0, 2).toLowerCase();
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code) ? (code as Language) : 'en';
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: resolveLanguage(getDeviceRegion().language),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React Native renders text, no HTML escaping needed
  returnNull: false,
});

export default i18n;

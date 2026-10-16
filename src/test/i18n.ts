import { createInstance, type TFunction } from 'i18next';

import en from '@/i18n/locales/en';
import tr from '@/i18n/locales/tr';

/** A real i18next `t` over the app's translation files (no device APIs), for tests. */
export async function testT(language: 'tr' | 'en'): Promise<TFunction> {
  const i18n = createInstance();
  await i18n.init({
    resources: { tr: { translation: tr }, en: { translation: en } },
    lng: language,
    interpolation: { escapeValue: false },
  });
  return i18n.t;
}

import { getCalendars, getLocales } from 'expo-localization';

import { isValidTimeZone } from '@/core/time';

export type DeviceRegion = {
  /** BCP 47 tag, e.g. "tr-TR". */
  locale: string;
  /** Language used for the UI, e.g. "tr". */
  language: string;
  currency: string;
  timeZone: string;
};

/** Region defaults taken from the device; used at sign-up and before the profile loads. */
export function getDeviceRegion(): DeviceRegion {
  const locale = getLocales()[0];
  const timeZone = getCalendars()[0]?.timeZone ?? 'UTC';
  return {
    locale: locale?.languageTag ?? 'en',
    language: locale?.languageCode ?? 'en',
    currency: locale?.currencyCode && /^[A-Z]{3}$/.test(locale.currencyCode) ? locale.currencyCode : 'USD',
    timeZone: isValidTimeZone(timeZone) ? timeZone : 'UTC',
  };
}

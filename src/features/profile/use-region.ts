import { useCallback } from 'react';

import { formatMoney } from '@/core/money';
import { getDeviceRegion } from '@/lib/region';
import { useProfile } from './use-profile';

export type Region = { currency: string; timeZone: string; locale: string };

const deviceRegion = getDeviceRegion();

/** The user's currency, time zone and formatting locale; device defaults until the profile loads. */
export function useRegion(): Region {
  const { data } = useProfile();
  return {
    currency: data?.currency ?? deviceRegion.currency,
    timeZone: data?.timeZone ?? deviceRegion.timeZone,
    locale: data?.locale ?? deviceRegion.locale,
  };
}

/** Formats amounts in the user's currency and locale. */
export function useFormatMoney(): (amount: number) => string {
  const { currency, locale } = useRegion();
  return useCallback((amount: number) => formatMoney(amount, { currency, locale }), [currency, locale]);
}

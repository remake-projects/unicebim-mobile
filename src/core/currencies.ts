/** Currencies offered in settings, roughly by where students using the app are likely to live. */
export const COMMON_CURRENCIES = [
  'TRY', 'EUR', 'USD', 'GBP', 'CHF', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'SEK', 'NOK', 'DKK',
  'AZN', 'GEL', 'KZT', 'UZS', 'UAH', 'RUB', 'AED', 'SAR', 'QAR', 'EGP', 'MAD', 'PKR', 'INR',
  'IDR', 'MYR', 'CNY', 'JPY', 'KRW', 'CAD', 'AUD', 'NZD', 'BRL', 'MXN', 'NGN', 'KES', 'ZAR',
] as const;

/** The common list with `current` first, so an unusual currency stays selectable. */
export function currencyChoices(current: string): string[] {
  return [current, ...COMMON_CURRENCIES.filter((c) => c !== current)];
}

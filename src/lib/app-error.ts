import type { Translations } from '@/i18n/locales/tr';

/** Keys under `errors.*` in the locales. */
export type ErrorKey = keyof Translations['errors'];

/** An error the UI can explain: `key` names its translated message. */
export class AppError<K extends ErrorKey = ErrorKey> extends Error {
  constructor(
    readonly key: K,
    options?: { cause?: unknown }
  ) {
    super(key, options);
    this.name = 'AppError';
  }
}

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { resolveLanguage } from '@/i18n';
import { useProfile } from './use-profile';

/** The interface follows the language saved in the profile (the device language until it loads). */
export function useProfileLanguage(): void {
  const { i18n } = useTranslation();
  const locale = useProfile().data?.locale;
  useEffect(() => {
    if (!locale) return;
    const language = resolveLanguage(locale);
    if (i18n.language !== language) void i18n.changeLanguage(language);
  }, [i18n, locale]);
}

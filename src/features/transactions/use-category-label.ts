import { useTranslation } from 'react-i18next';

import tr, { type Translations } from '@/i18n/locales/tr';

type CategoryKey = keyof Translations['categories'];

// tr is the source of truth for translation keys.
const isKnown = (category: string): category is CategoryKey => Object.hasOwn(tr.categories, category);

/** Translated category name; unknown ids fall back to "other". */
export function useCategoryLabel(): (category: string) => string {
  const { t } = useTranslation();
  return (category) => t(`categories.${isKnown(category) ? category : 'other'}`);
}

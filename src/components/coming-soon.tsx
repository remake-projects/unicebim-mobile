import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';

/** Placeholder for tabs that are built in the next phases. */
export function ComingSoon({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <Screen centered>
      <ThemedText type="subtitle">{title}</ThemedText>
      <ThemedText themeColor="textSecondary">{t('common.comingSoon')}</ThemedText>
    </Screen>
  );
}

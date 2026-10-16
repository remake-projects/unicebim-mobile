import { useTranslation } from 'react-i18next';
import { Alert, Share } from 'react-native';

import { errorMessage } from '@/i18n/messages';

/** Opens the system share sheet with a text message. */
export function useShareMessage(): (message: string) => Promise<void> {
  const { t } = useTranslation();
  return async (message) => {
    try {
      await Share.share({ message });
    } catch (error) {
      Alert.alert(errorMessage(t, error));
    }
  };
}

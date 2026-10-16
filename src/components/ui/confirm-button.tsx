import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { errorMessage } from '@/i18n/messages';
import { confirmDestructive } from '@/lib/confirm';
import { Button, type ButtonProps } from './button';

type Props = Omit<ButtonProps, 'onPress' | 'loading'> & {
  confirmTitle: string;
  confirmMessage: string;
  /** Label of the destructive choice in the dialog; defaults to "Delete". */
  confirmLabel?: string;
  onConfirm: () => Promise<unknown>;
};

/** Button for a destructive action: asks first, shows progress, alerts on failure. */
export function ConfirmButton({ confirmTitle, confirmMessage, confirmLabel, onConfirm, variant = 'ghost', ...rest }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  async function onPress() {
    const confirmed = await confirmDestructive({
      title: confirmTitle,
      message: confirmMessage,
      confirmLabel: confirmLabel ?? t('common.delete'),
      cancelLabel: t('common.cancel'),
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      await onConfirm();
    } catch (error) {
      Alert.alert(errorMessage(t, error));
    } finally {
      setBusy(false);
    }
  }

  return <Button variant={variant} loading={busy} onPress={onPress} {...rest} />;
}

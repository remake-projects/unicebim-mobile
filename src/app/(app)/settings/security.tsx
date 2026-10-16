import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { SwitchRow } from '@/components/ui/switch-row';
import { canLockApp, verifyOwner } from '@/features/app-lock/biometrics';
import { ensureNotificationPermission } from '@/features/reminders/notifications';
import { setDeviceSetting, useDeviceSettings } from '@/lib/device-settings';

type Problem = 'permissionDenied' | 'appLockUnavailable';

/** Device-level preferences: reminders and the app lock. */
export default function SecuritySettingsScreen() {
  const { t } = useTranslation();
  const settings = useDeviceSettings();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setProblem(null);
    try {
      await task();
    } finally {
      setBusy(false);
    }
  }

  const toggleReminders = (on: boolean) =>
    run(async () => {
      if (on && !(await ensureNotificationPermission(t('reminders.channel')))) return setProblem('permissionDenied');
      setDeviceSetting('reminders', on);
    });

  // Turning the lock on or off both require the owner, so a borrowed phone cannot disable it.
  const toggleAppLock = (on: boolean) =>
    run(async () => {
      if (on && !(await canLockApp())) return setProblem('appLockUnavailable');
      if (await verifyOwner(t('security.unlockPrompt'), t('common.cancel'))) setDeviceSetting('appLock', on);
    });

  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <View>
        <SwitchRow
          label={t('security.reminders')}
          hint={t('security.remindersHint')}
          value={settings.reminders}
          onValueChange={toggleReminders}
          disabled={busy}
        />
        <SwitchRow
          label={t('security.appLock')}
          hint={t('security.appLockHint')}
          value={settings.appLock}
          onValueChange={toggleAppLock}
          disabled={busy}
        />
      </View>
      <FormMessage message={problem ? t(`security.${problem}`) : null} />
      {problem === 'permissionDenied' ? (
        <Button variant="secondary" title={t('security.openSettings')} onPress={() => Linking.openSettings()} />
      ) : null}
    </Screen>
  );
}

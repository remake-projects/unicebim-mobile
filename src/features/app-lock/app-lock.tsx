import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { signOut } from '@/features/auth/auth-api';
import { useTheme } from '@/hooks/use-theme';
import { getDeviceSettings, useDeviceSettings } from '@/lib/device-settings';
import { useAppSwitcherPrivacy } from './app-switcher-privacy';
import { verifyOwner } from './biometrics';

/** Locks again only after the app spent longer than this in the background. */
const RELOCK_AFTER_MS = 30_000;

/**
 * Lock state of the signed-in app while the setting is on: locked at start and after
 * RELOCK_AFTER_MS in the background. The layout renders <LockScreen> *instead of* the
 * navigator while locked, so no screen (not even one opened by a deep link) is mounted
 * behind the lock.
 */
export function useAppLock(): { locked: boolean; unlock: () => void } {
  const { appLock } = useDeviceSettings();
  const [locked, setLocked] = useState(() => getDeviceSettings().appLock);
  const backgroundSince = useRef<number | null>(null);
  useAppSwitcherPrivacy(appLock);

  useEffect(() => {
    if (!appLock) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') backgroundSince.current = Date.now();
      if (state === 'active') {
        const since = backgroundSince.current;
        backgroundSince.current = null;
        if (since != null && Date.now() - since > RELOCK_AFTER_MS) setLocked(true);
      }
    });
    return () => subscription.remove();
  }, [appLock]);

  // Turning the setting off unlocks right away.
  return { locked: appLock && locked, unlock: () => setLocked(false) };
}

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [busy, setBusy] = useState(false);

  async function unlock() {
    setBusy(true);
    try {
      if (await verifyOwner(t('security.unlockPrompt'), t('common.cancel'))) onUnlock();
    } finally {
      setBusy(false);
    }
  }

  // Prompt once when the lock appears; afterwards the button retries.
  const prompt = t('security.unlockPrompt');
  const cancel = t('common.cancel');
  useEffect(() => {
    verifyOwner(prompt, cancel)
      .then((ok) => ok && onUnlock())
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Icon name="lock" color={theme.text} size={48} />
      <Text style={[styles.title, { color: theme.text }]}>{t('security.locked')}</Text>
      <View style={styles.actions}>
        <Button title={t('security.unlock')} loading={busy} onPress={unlock} />
        <Button variant="ghost" title={t('auth.signOut')} disabled={busy} onPress={() => void signOut().catch(() => {})} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  title: { fontSize: 22, fontWeight: 700 },
  actions: { alignSelf: 'stretch', gap: Spacing.two },
});

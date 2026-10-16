import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Modal, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { signOut } from '@/features/auth/auth-api';
import { useTheme } from '@/hooks/use-theme';
import { getDeviceSettings, useDeviceSettings } from '@/lib/device-settings';
import { verifyOwner } from './biometrics';

/** Locks again only after the app spent longer than this in the background. */
const RELOCK_AFTER_MS = 30_000;

/**
 * Full-screen lock over the signed-in app (a Modal, so it also covers modal screens).
 * Locked at start and after RELOCK_AFTER_MS in the background, while the setting is on.
 */
export function AppLock() {
  const { appLock } = useDeviceSettings();
  const [locked, setLocked] = useState(() => getDeviceSettings().appLock);
  const backgroundSince = useRef<number | null>(null);

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
  const visible = appLock && locked;
  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => {}}>
      {visible ? <LockScreen onUnlock={() => setLocked(false)} /> : null}
    </Modal>
  );
}

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
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
      <Text style={styles.icon}>🔒</Text>
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
  icon: { fontSize: 48 },
  title: { fontSize: 22, fontWeight: 700 },
  actions: { alignSelf: 'stretch', gap: Spacing.two },
});

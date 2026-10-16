import {
  allowScreenCaptureAsync,
  disableAppSwitcherProtectionAsync,
  enableAppSwitcherProtectionAsync,
  preventScreenCaptureAsync,
} from 'expo-screen-capture';
import { useEffect } from 'react';
import { Platform } from 'react-native';

const KEY = 'app-lock';

/**
 * While the app lock is on, balances must not show in the app switcher preview either.
 * iOS blurs the preview; Android has no preview-only switch, so FLAG_SECURE blanks the preview
 * and also blocks screenshots of the app.
 */
export function useAppSwitcherPrivacy(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const ios = Platform.OS === 'ios';
    (ios ? enableAppSwitcherProtectionAsync(1) : preventScreenCaptureAsync(KEY)).catch(() => {});
    return () => {
      (ios ? disableAppSwitcherProtectionAsync() : allowScreenCaptureAsync(KEY)).catch(() => {});
    };
  }, [enabled]);
}

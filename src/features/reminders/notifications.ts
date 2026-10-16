import {
  AndroidImportance,
  cancelAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  SchedulableTriggerInputTypes,
  setNotificationChannelAsync,
  setNotificationHandler,
} from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'reminders';

export type ScheduledReminder = { id: string; at: Date; title: string; body: string };

/** Show reminders as banners even while the app is open. Call once at startup. */
export function configureNotifications(): void {
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Asks for permission if it can still be asked; true when notifications may be shown. */
export async function ensureNotificationPermission(channelName: string): Promise<boolean> {
  // Android 13+ only shows the permission prompt once a channel exists.
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync(CHANNEL_ID, { name: channelName, importance: AndroidImportance.DEFAULT });
  }
  const current = await getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await requestPermissionsAsync()).granted;
}

/** Replaces every scheduled reminder with `reminders`. */
export async function replaceReminders(reminders: readonly ScheduledReminder[]): Promise<void> {
  await cancelAllScheduledNotificationsAsync();
  for (const r of reminders) {
    await scheduleNotificationAsync({
      identifier: r.id,
      content: { title: r.title, body: r.body },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: r.at, channelId: CHANNEL_ID },
    });
  }
}

export function cancelReminders(): Promise<void> {
  return cancelAllScheduledNotificationsAsync();
}

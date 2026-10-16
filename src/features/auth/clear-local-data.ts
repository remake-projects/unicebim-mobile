import { cancelReminders } from '@/features/reminders/notifications';
import { resetDeviceSettings } from '@/lib/device-settings';
import { queryClient } from '@/lib/query-client';
import { queryPersister } from '@/lib/query-persistence';

/** After sign-out: nothing of this user stays on the device for the next one. */
export async function clearLocalUserData(): Promise<void> {
  queryClient.clear();
  resetDeviceSettings();
  await Promise.allSettled([queryPersister.removeClient(), cancelReminders()]);
}

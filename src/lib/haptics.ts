import * as Haptics from 'expo-haptics';

/**
 * Fire-and-forget touch feedback. Haptics are a nicety: a device without a vibration
 * motor (or with haptics turned off) must never surface an error to the user.
 */
function play(effect: () => Promise<void>) {
  effect().catch(() => undefined);
}

export const haptics = {
  /** A choice changed (tabs, chips, category tiles). */
  select: () => play(() => Haptics.selectionAsync()),
  /** A form was saved or an item was deleted. */
  success: () => play(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Saving failed. */
  error: () => play(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};

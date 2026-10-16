import { authenticateAsync, hasHardwareAsync, isEnrolledAsync } from 'expo-local-authentication';

/** True when the device can verify the owner (biometrics, falling back to the passcode). */
export async function canLockApp(): Promise<boolean> {
  return (await hasHardwareAsync()) && (await isEnrolledAsync());
}

/** Shows the system prompt; true when the owner was verified. */
export async function verifyOwner(promptMessage: string, cancelLabel: string): Promise<boolean> {
  const result = await authenticateAsync({ promptMessage, cancelLabel });
  return result.success;
}

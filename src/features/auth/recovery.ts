/**
 * One-shot permission to open the "set a new password" screen. Only a password-recovery
 * e-mail link exchanged on this device grants it, so the screen cannot be reached by a plain
 * deep link (unicebim://reset-password) to change the password without knowing the current one.
 * Kept in memory only: a restart or leaving the screen takes it back.
 */
let granted = false;

export function grantRecovery(): void {
  granted = true;
}

export function hasRecoveryGrant(): boolean {
  return granted;
}

export function revokeRecovery(): void {
  granted = false;
}

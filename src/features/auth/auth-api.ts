import { FunctionsFetchError, isAuthPKCECodeVerifierMissingError } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import type { ChangePasswordInput, LoginInput, RegisterInput } from '@/core/schemas/auth';
import { AppError } from '@/lib/app-error';
import type { DeviceRegion } from '@/lib/region';
import { supabase } from '@/lib/supabase';
import { AuthFailure, toAuthErrorKey } from './auth-errors';

/** Deep link that e-mail confirmation and password reset links return to. */
export function authCallbackUrl(): string {
  return Linking.createURL('auth/callback');
}

function fail(error: unknown): never {
  throw new AuthFailure(toAuthErrorKey(error));
}

export async function signIn({ email, password }: LoginInput): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) fail(error);
}

export type SignUpResult = { needsEmailConfirmation: boolean };

/**
 * Creates the account. Region and localized default wallet names travel as metadata;
 * the handle_new_user trigger turns them into the profile and the first two wallets.
 */
export async function signUp(
  input: RegisterInput,
  region: DeviceRegion,
  walletNames: [cash: string, bank: string]
): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: authCallbackUrl(),
      data: {
        full_name: input.fullName,
        currency: region.currency,
        timezone: region.timeZone,
        locale: region.language,
        wallet_names: walletNames,
      },
    },
  });
  if (error) fail(error);
  return { needsEmailConfirmation: !data.session };
}

/** Never reveals whether the address has an account. */
export async function resendConfirmation(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: authCallbackUrl() } });
  if (error && toAuthErrorKey(error) === 'rateLimited') fail(error);
}

/** Never reveals whether the address has an account. */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: authCallbackUrl() });
  if (error && toAuthErrorKey(error) === 'rateLimited') fail(error);
}

/**
 * Exchange the PKCE code from an e-mail link for a session on this device.
 * 'recovery' means the link came from a password reset requested here: supabase-js stores that
 * with the code verifier and reports it as a PASSWORD_RECOVERY event during the exchange, so a
 * URL parameter cannot fake it.
 * Returns 'otherDevice' when the link was requested on another device (no code verifier here);
 * the address is verified anyway, the user just has to sign in.
 */
export async function exchangeAuthCode(code: string): Promise<'signedIn' | 'recovery' | 'otherDevice'> {
  let recovery = false;
  const { data: listener } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') recovery = true;
  });
  let error;
  try {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } finally {
    listener.subscription.unsubscribe();
  }
  if (!error) return recovery ? 'recovery' : 'signedIn';
  if (isAuthPKCECodeVerifierMissingError(error)) return 'otherDevice';
  fail(error);
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) fail(error);
}

/**
 * Supabase does not ask for the current password before sensitive changes, so it is checked
 * by signing in with it. The fresh sign-in also satisfies the project's "recent login"
 * requirement for password changes.
 */
async function verifyCurrentPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const key = toAuthErrorKey(error);
    throw new AuthFailure(key === 'invalidCredentials' ? 'wrongPassword' : key);
  }
}

export async function changePassword(email: string, input: ChangePasswordInput): Promise<void> {
  await verifyCurrentPassword(email, input.currentPassword);
  await updatePassword(input.newPassword);
}

/**
 * Deletes the account and everything in it (delete-account Edge Function) after the password
 * is confirmed, then forgets the session on this device; the SIGNED_OUT event clears the cache
 * and the guard shows sign-in.
 */
export async function deleteAccount(email: string, password: string): Promise<void> {
  await verifyCurrentPassword(email, password);
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw new AppError(error instanceof FunctionsFetchError ? 'network' : 'generic', { cause: error });
  await supabase.auth.signOut({ scope: 'local' });
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) fail(error);
}

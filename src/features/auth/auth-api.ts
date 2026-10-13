import { isAuthPKCECodeVerifierMissingError } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import type { LoginInput, RegisterInput } from '@/core/schemas/auth';
import type { DeviceRegion } from '@/lib/region';
import { supabase } from '@/lib/supabase';
import { AuthFailure, toAuthErrorKey } from './auth-errors';

/** Deep link that e-mail confirmation and password reset links return to. */
export function authCallbackUrl(next?: string): string {
  return Linking.createURL('auth/callback', next ? { queryParams: { next } } : undefined);
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
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: authCallbackUrl('reset-password') });
  if (error && toAuthErrorKey(error) === 'rateLimited') fail(error);
}

/**
 * Exchange the PKCE code from an e-mail link for a session on this device.
 * Returns 'otherDevice' when the link was requested on another device (no code verifier here);
 * the address is verified anyway, the user just has to sign in.
 */
export async function exchangeAuthCode(code: string): Promise<'signedIn' | 'otherDevice'> {
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) return 'signedIn';
  if (isAuthPKCECodeVerifierMissingError(error)) return 'otherDevice';
  fail(error);
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) fail(error);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) fail(error);
}

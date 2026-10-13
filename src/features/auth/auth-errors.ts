import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';

/** Keys under `errors.*` in the locales. */
export type AuthErrorKey = 'invalidCredentials' | 'emailNotConfirmed' | 'rateLimited' | 'network' | 'generic';

export function toAuthErrorKey(error: unknown): AuthErrorKey {
  if (isAuthRetryableFetchError(error)) return 'network';
  if (!isAuthError(error)) return 'generic';
  switch (error.code) {
    case 'invalid_credentials':
      return 'invalidCredentials';
    case 'email_not_confirmed':
      return 'emailNotConfirmed';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'rateLimited';
    default:
      return error.status === 429 ? 'rateLimited' : 'generic';
  }
}

export class AuthFailure extends Error {
  constructor(readonly key: AuthErrorKey) {
    super(key);
  }
}

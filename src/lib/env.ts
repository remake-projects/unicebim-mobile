function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name}. Copy env.example to .env.local and fill it in.`);
  }
  return value;
}

// EXPO_PUBLIC_* values are inlined at build time, so they must be read with static property access.
export const env = {
  supabaseUrl: required('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: required(
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ),
  /** Public legal pages; required for store builds, optional in development (links are hidden). */
  privacyPolicyUrl: process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || null,
  termsUrl: process.env.EXPO_PUBLIC_TERMS_URL || null,
};

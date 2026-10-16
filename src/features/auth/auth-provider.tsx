import type { Session } from '@supabase/supabase-js';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { supabase } from '@/lib/supabase';
import { clearLocalUserData } from './clear-local-data';

type AuthState = { session: Session | null; isLoading: boolean };

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({ session: null, isLoading: true });

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setState({ session: data.session, isLoading: false });
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // Never show one user's cached data to the next one.
      if (event === 'SIGNED_OUT') void clearLocalUserData();
      setState({ session, isLoading: false });
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext value={state}>{children}</AuthContext>;
}

export function useAuth(): AuthState {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}

/** The signed-in user's id. Only call from screens behind the session guard. */
export function useUserId(): string {
  const { session } = useAuth();
  if (!session) throw new Error('useUserId requires a signed-in user');
  return session.user.id;
}

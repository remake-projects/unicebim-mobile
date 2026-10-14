import { AppError, type ErrorKey } from './app-error';

type PostgrestLikeError = { code?: string; message?: string };

export type DataErrorKey = Extract<ErrorKey, 'insufficientBalance' | 'notFound' | 'network' | 'generic'>;

const NETWORK_MESSAGE = /network request failed|failed to fetch|fetch failed/i;

/** Map a PostgREST / Postgres error to a message key (SQLSTATEs: supabase/README.md). */
export function toDataErrorKey(error: PostgrestLikeError): DataErrorKey {
  const message = error.message ?? '';
  if (NETWORK_MESSAGE.test(message)) return 'network';
  switch (error.code) {
    case '23514':
      // Only the wallet balance check is reachable after client-side validation.
      return message.includes('balance') ? 'insufficientBalance' : 'generic';
    case 'P0002':
    case 'PGRST116': // .single() found no row (missing or not visible under RLS)
      return 'notFound';
    default:
      return 'generic';
  }
}

/** Return `data` or throw an AppError describing `error`. */
export function unwrap<R extends { error: PostgrestLikeError | null }>(result: R): SuccessData<R> {
  if (result.error) throw new AppError(toDataErrorKey(result.error), { cause: result.error });
  return (result as unknown as { data: SuccessData<R> }).data;
}

/** The `data` type of the success branch of a supabase-js response union. */
type SuccessData<R> = R extends { error: null; data: infer D } ? D : never;

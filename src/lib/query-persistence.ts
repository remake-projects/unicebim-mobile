import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import Storage from 'expo-sqlite/kv-store';

/** Bump when cached data shapes change, so old caches are discarded instead of restored. */
const CACHE_VERSION = '1';

/** The signed-in user's query cache, saved on the device for offline reading. */
export const queryPersister = createAsyncStoragePersister({ storage: Storage, key: 'unicebim.queryCache' });

/** A cache saved for another user (or an older app version) is never restored. */
export function cacheBuster(userId: string): string {
  return `${CACHE_VERSION}:${userId}`;
}

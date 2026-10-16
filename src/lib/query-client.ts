import { QueryClient } from '@tanstack/react-query';

/** How long cached data is kept (in memory and on disk) for reading while offline. */
export const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, gcTime: CACHE_MAX_AGE },
    // Writes are not queued offline (the server may reject them later, e.g. for balance);
    // they fail right away with a network error instead of waiting.
    mutations: { retry: 0, networkMode: 'always' },
  },
});

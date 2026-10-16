import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';

/** A mutation that marks the given queries (and everything under them) stale once it succeeds. */
export function useInvalidatingMutation<TVariables, TData = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  keys: readonly QueryKey[]
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey }))),
  });
}

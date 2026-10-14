import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import { fetchUnpaidPaymentAmounts } from './payments-api';

export function useUnpaidPaymentAmounts() {
  return useQuery({ queryKey: queryKeys.unpaidPayments, queryFn: fetchUnpaidPaymentAmounts });
}

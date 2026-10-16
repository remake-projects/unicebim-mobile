import type { PropsWithChildren } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/ui/card';
import { useFormatMoney } from '@/features/profile/use-region';
import { useTheme } from '@/hooks/use-theme';
import type { Payment } from '../payments-api';

/** Name and amount of a payment, with optional notes below. */
export function PaymentCard({ payment, children }: PropsWithChildren<{ payment: Payment }>) {
  const theme = useTheme();
  const format = useFormatMoney();
  return (
    <Card>
      <Text style={[styles.name, { color: theme.text }]}>{payment.name}</Text>
      <Text style={[styles.amount, { color: theme.text }]}>{format(payment.amount)}</Text>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 17, fontWeight: 600 },
  amount: { fontSize: 28, fontWeight: 800, fontVariant: ['tabular-nums'] },
});

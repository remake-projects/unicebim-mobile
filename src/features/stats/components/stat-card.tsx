import type { PropsWithChildren } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';

/** Card with a heading, for one chart or figure. */
export function StatCard({ title, children }: PropsWithChildren<{ title: string }>) {
  const theme = useTheme();
  return (
    <Card>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
        {title}
      </Text>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: 700 },
});

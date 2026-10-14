import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = PropsWithChildren<{
  centered?: boolean;
  /** Screens shown under a native header (stack screens, modals) skip the top inset. */
  edges?: readonly Edge[];
  /** Extra bottom space, e.g. for a floating button. */
  bottomInset?: number;
  /** Enables pull to refresh. */
  onRefresh?: () => void;
  refreshing?: boolean;
}>;

/** Scrollable, keyboard-aware screen container with safe-area padding. */
const DEFAULT_EDGES: readonly Edge[] = ['top', 'left', 'right'];
/** For screens under a native header (stack screens, modals): the header covers the top. */
export const UNDER_HEADER_EDGES: readonly Edge[] = ['left', 'right'];

export function Screen({ children, centered = false, edges = DEFAULT_EDGES, bottomInset = 0, onRefresh, refreshing = false }: Props) {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={edges}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, centered && styles.centered, { paddingBottom: Spacing.four + bottomInset }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    gap: Spacing.three,
    padding: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  centered: { justifyContent: 'center' },
});

import { useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Icon } from './icon';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  ref?: Ref<TextInput>;
};

/** Labelled input; password fields (`secureTextEntry`) get a show / hide toggle. */
export function TextField({ label, error, style, secureTextEntry, ref, ...rest }: TextFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [revealed, setRevealed] = useState(false);
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View
        style={[
          styles.box,
          { backgroundColor: theme.backgroundElement, borderColor: error ? theme.danger : theme.border },
        ]}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={secureTextEntry && !revealed}
          style={[styles.input, { color: theme.text }, style]}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? t('common.hidePassword') : t('common.showPassword')}
            onPress={() => setRevealed((r) => !r)}
            hitSlop={8}
            style={styles.toggle}>
            <Icon name={revealed ? 'eyeSlash' : 'eye'} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: theme.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.one },
  label: { fontSize: 14, fontWeight: 600 },
  box: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: Radius.md },
  input: { flex: 1, minHeight: 48, paddingHorizontal: Spacing.three, fontSize: 16 },
  toggle: { paddingHorizontal: Spacing.three, minHeight: 48, justifyContent: 'center' },
  error: { fontSize: 13 },
});

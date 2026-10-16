import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LegalLinks } from '@/components/legal-links';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { IconTile } from '@/components/ui/icon';
import { MenuRow } from '@/components/ui/menu-row';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Spacing } from '@/constants/theme';
import { signOut } from '@/features/auth/auth-api';
import { useAuth } from '@/features/auth/auth-provider';
import { useProfile } from '@/features/profile/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/i18n/messages';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { session } = useAuth();
  const profile = useProfile();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = (href: Href) => () => router.push(href);

  async function onSignOut() {
    setBusy(true);
    setError(null);
    try {
      await signOut(); // the root guard returns to sign-in
    } catch (e) {
      setError(errorMessage(t, e));
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('profile.edit')}
        onPress={open('/settings/profile')}
        style={({ pressed }) => [styles.header, { opacity: pressed ? 0.7 : 1 }]}>
        <Avatar uri={profile.data?.avatarUrl ?? null} name={profile.data?.fullName ?? null} size={64} />
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: theme.text }]}>{profile.data?.fullName ?? t('tabs.profile')}</Text>
          <Text style={{ color: theme.textSecondary }}>{session?.user.email}</Text>
        </View>
      </Pressable>

      <SectionHeader title={t('profile.planning')} />
      <View>
        <MenuRow leading={<IconTile name="wallet" />} title={t('wallets.title')} subtitle={t('wallets.subtitle')} onPress={open('/wallets')} />
        <MenuRow leading={<IconTile name="calendar" />} title={t('payments.title')} subtitle={t('payments.subtitle')} onPress={open('/payments')} />
        <MenuRow leading={<IconTile name="repeat" />} title={t('subscriptions.title')} subtitle={t('subscriptions.subtitle')} onPress={open('/subscriptions')} />
        <MenuRow leading={<IconTile name="pin" />} title={t('fixedExpenses.title')} subtitle={t('fixedExpenses.subtitle')} onPress={open('/fixed-expenses')} />
        <MenuRow leading={<IconTile name="target" />} title={t('budget.title')} subtitle={t('budget.subtitle')} onPress={open('/settings/budget')} />
      </View>

      <SectionHeader title={t('profile.tools')} />
      <View>
        <MenuRow leading={<IconTile name="import" />} title={t('bankImport.title')} subtitle={t('bankImport.subtitle')} onPress={open('/bank-import')} />
        <MenuRow leading={<IconTile name="report" />} title={t('stats.report')} subtitle={t('stats.reportSubtitle')} onPress={open('/report')} />
        <MenuRow leading={<IconTile name="split" />} title={t('billSplitter.title')} subtitle={t('billSplitter.subtitle')} onPress={open('/bill-splitter')} />
      </View>

      <SectionHeader title={t('profile.account')} />
      <View>
        <MenuRow leading={<IconTile name="person" />} title={t('profile.edit')} subtitle={t('profile.editSubtitle')} onPress={open('/settings/profile')} />
        <MenuRow leading={<IconTile name="key" />} title={t('profile.changePassword')} onPress={open('/settings/password')} />
        <MenuRow leading={<IconTile name="globe" />} title={t('region.title')} subtitle={t('region.subtitle')} onPress={open('/settings/region')} />
        <MenuRow leading={<IconTile name="lock" />} title={t('security.title')} subtitle={t('security.subtitle')} onPress={open('/settings/security')} />
      </View>

      <FormMessage message={error} />
      <Button variant="secondary" title={t('auth.signOut')} loading={busy} onPress={onSignOut} />
      <Button variant="ghost" title={t('profile.deleteAccount')} onPress={open('/settings/delete-account')} />
      <LegalLinks />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  headerText: { flex: 1, gap: Spacing.half },
  name: { fontSize: 22, fontWeight: 700 },
});

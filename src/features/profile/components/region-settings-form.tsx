import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { FieldGroup } from '@/components/ui/field-group';
import { FormMessage } from '@/components/ui/form-message';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Spacing } from '@/constants/theme';
import { currencyChoices } from '@/core/currencies';
import { regionSettingsSchema, type RegionSettingsInput } from '@/core/schemas/profile';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { resolveLanguage, SUPPORTED_LANGUAGES } from '@/i18n';
import { getDeviceRegion } from '@/lib/region';
import type { Profile } from '../profile-api';

/** Language names are shown in their own language. */
const LANGUAGE_NAMES: Record<(typeof SUPPORTED_LANGUAGES)[number], string> = { tr: 'Türkçe', en: 'English' };

type Props = { profile: Profile; onSubmit: (values: RegionSettingsInput) => Promise<unknown> };

export function RegionSettingsForm({ profile, onSubmit }: Props) {
  const { t } = useTranslation();
  const { error, submit } = useFormSubmit(onSubmit);
  const deviceZone = getDeviceRegion().timeZone;
  const { control, handleSubmit, formState } = useForm<RegionSettingsInput>({
    resolver: zodResolver(regionSettingsSchema),
    defaultValues: { currency: profile.currency, timeZone: profile.timeZone, locale: resolveLanguage(profile.locale) },
  });
  const locale = useController({ control, name: 'locale' });
  const currency = useController({ control, name: 'currency' });
  const timeZone = useController({ control, name: 'timeZone' });
  const zones = [...new Set([profile.timeZone, deviceZone])];

  return (
    <View style={styles.form}>
      <FieldGroup label={t('region.language')}>
        <SegmentedControl
          options={SUPPORTED_LANGUAGES.map((l) => ({ value: l, label: LANGUAGE_NAMES[l] }))}
          value={resolveLanguage(locale.field.value)}
          onChange={locale.field.onChange}
          accessibilityLabel={t('region.language')}
        />
      </FieldGroup>
      <FieldGroup label={t('region.currency')} hint={t('region.currencyHint')}>
        <ChoiceChips
          options={currencyChoices(profile.currency).map((c) => ({ value: c, label: c }))}
          value={currency.field.value}
          onChange={currency.field.onChange}
          accessibilityLabel={t('region.currency')}
        />
      </FieldGroup>
      <FieldGroup label={t('region.timeZone')} hint={t('region.timeZoneHint')}>
        <ChoiceChips
          options={zones.map((z) => ({
            value: z,
            label: z === deviceZone ? t('region.deviceTimeZone', { zone: z }) : z,
          }))}
          value={timeZone.field.value}
          onChange={timeZone.field.onChange}
          accessibilityLabel={t('region.timeZone')}
        />
      </FieldGroup>
      <FormMessage message={error} />
      <Button title={t('common.save')} loading={formState.isSubmitting} onPress={handleSubmit(submit)} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
});

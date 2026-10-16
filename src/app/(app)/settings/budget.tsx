import { router } from 'expo-router';

import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { BudgetSettingsForm } from '@/features/profile/components/budget-settings-form';
import { useProfile, useUpdateBudgetSettings } from '@/features/profile/use-profile';

export default function BudgetSettingsScreen() {
  const profile = useProfile();
  const update = useUpdateBudgetSettings();

  if (profile.isError) return <ErrorState error={profile.error} onRetry={() => profile.refetch()} />;
  if (!profile.data) return <LoadingState />;

  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <BudgetSettingsForm
        profile={profile.data}
        onSubmit={async (values) => {
          await update.mutateAsync(values);
          router.back();
        }}
      />
    </Screen>
  );
}

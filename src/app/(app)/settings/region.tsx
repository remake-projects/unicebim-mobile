import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { RegionSettingsForm } from '@/features/profile/components/region-settings-form';
import { useProfile, useUpdateRegionSettings } from '@/features/profile/use-profile';

export default function RegionSettingsScreen() {
  const client = useQueryClient();
  const profile = useProfile();
  const update = useUpdateRegionSettings();

  if (profile.isError) return <ErrorState error={profile.error} onRetry={() => profile.refetch()} />;
  if (!profile.data) return <LoadingState />;

  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <RegionSettingsForm
        profile={profile.data}
        onSubmit={async (values) => {
          await update.mutateAsync(values);
          // Month ranges, "today" and subscription currencies all depend on the region.
          await client.invalidateQueries();
          router.back();
        }}
      />
    </Screen>
  );
}

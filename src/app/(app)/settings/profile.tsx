import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { ProfileNameForm } from '@/features/profile/components/profile-name-form';
import { useChangeAvatar, useProfile, useRemoveAvatar, useUpdateFullName } from '@/features/profile/use-profile';
import { errorMessage } from '@/i18n/messages';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const profile = useProfile();
  const updateName = useUpdateFullName();
  const changeAvatar = useChangeAvatar();
  const removeAvatar = useRemoveAvatar();

  if (profile.isLoadingError) return <ErrorState error={profile.error} onRetry={() => profile.refetch()} />;
  if (!profile.data) return <LoadingState />;
  const { fullName, avatarUrl } = profile.data;

  async function onChangePhoto() {
    try {
      await changeAvatar.mutateAsync(avatarUrl);
    } catch (error) {
      Alert.alert(errorMessage(t, error));
    }
  }

  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <View style={styles.photo}>
        <Avatar uri={avatarUrl} name={fullName} size={96} />
        <Button
          variant="secondary"
          title={t(avatarUrl ? 'profile.changePhoto' : 'profile.addPhoto')}
          loading={changeAvatar.isPending}
          onPress={onChangePhoto}
        />
        {avatarUrl ? (
          <ConfirmButton
            title={t('profile.removePhoto')}
            confirmTitle={t('profile.removePhotoTitle')}
            confirmMessage={t('profile.removePhotoMessage')}
            confirmLabel={t('profile.removePhotoConfirm')}
            onConfirm={() => removeAvatar.mutateAsync(avatarUrl)}
          />
        ) : null}
      </View>
      <ProfileNameForm
        fullName={fullName ?? ''}
        onSubmit={async (name) => {
          await updateName.mutateAsync(name);
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { alignItems: 'center', gap: Spacing.two },
});

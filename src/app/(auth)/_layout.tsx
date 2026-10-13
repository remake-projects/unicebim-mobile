import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export const unstable_settings = { initialRouteName: 'sign-in' };

export default function AuthLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', headerTransparent: true, title: '' }}>
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="check-email" options={{ title: t('auth.checkEmail.title') }} />
    </Stack>
  );
}

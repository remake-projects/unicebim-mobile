import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { WalletForm } from '@/features/wallets/components/wallet-form';
import { useCreateWallet } from '@/features/wallets/use-wallets';

export default function NewWalletScreen() {
  const { t } = useTranslation();
  const create = useCreateWallet();
  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <WalletForm
        defaultValues={{ name: '', balance: '', isDefault: false }}
        showDefaultToggle
        submitLabel={t('common.save')}
        onSubmit={async (values) => {
          await create.mutateAsync(values);
          router.back();
        }}
      />
    </Screen>
  );
}

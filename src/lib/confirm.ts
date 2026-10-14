import { Alert } from 'react-native';

type ConfirmOptions = { title: string; message: string; confirmLabel: string; cancelLabel: string };

/** Native confirmation dialog for destructive actions; resolves true when confirmed. */
export function confirmDestructive({ title, message, confirmLabel, cancelLabel }: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

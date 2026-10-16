import { useController, type Control, type FieldPath, type FieldValues, type UseFormSetFocus } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TextInputProps } from 'react-native';

import { validationMessage } from '@/i18n/messages';
import { TextField, type TextFieldProps } from './text-field';

type Props<T extends FieldValues> = Omit<TextFieldProps, 'value' | 'onChangeText' | 'onBlur' | 'error' | 'ref'> & {
  control: Control<T>;
  name: FieldPath<T>;
};

/**
 * TextField bound to react-hook-form; shows the translated validation error. The input is
 * registered as the field's ref, so a failed submit focuses the first invalid field.
 */
export function FormTextField<T extends FieldValues>({ control, name, ...rest }: Props<T>) {
  const { t } = useTranslation();
  // `ref` is pulled out so the compiler does not treat the whole field object as a ref.
  const {
    field: { ref, ...field },
    fieldState,
  } = useController({ control, name });
  return (
    <TextField
      {...rest}
      ref={ref}
      value={field.value == null ? '' : String(field.value)}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      error={validationMessage(t, fieldState.error?.message)}
    />
  );
}

/** Keyboard "next" moves to `next` without dropping the keyboard. */
export function focusNext<T extends FieldValues>(setFocus: UseFormSetFocus<T>, next: FieldPath<T>): TextInputProps {
  return { returnKeyType: 'next', submitBehavior: 'submit', onSubmitEditing: () => setFocus(next) };
}

/** Keyboard "done" on the last field submits the form. */
export function submitOnDone(submit: () => unknown): TextInputProps {
  return { returnKeyType: 'done', onSubmitEditing: () => void submit() };
}

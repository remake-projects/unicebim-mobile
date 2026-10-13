import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { validationMessage } from '@/i18n/messages';
import { TextField, type TextFieldProps } from './text-field';

type Props<T extends FieldValues> = Omit<TextFieldProps, 'value' | 'onChangeText' | 'onBlur' | 'error'> & {
  control: Control<T>;
  name: FieldPath<T>;
};

/** TextField bound to react-hook-form; shows the translated validation error. */
export function FormTextField<T extends FieldValues>({ control, name, ...rest }: Props<T>) {
  const { t } = useTranslation();
  const { field, fieldState } = useController({ control, name });
  return (
    <TextField
      {...rest}
      value={field.value == null ? '' : String(field.value)}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      error={validationMessage(t, fieldState.error?.message)}
    />
  );
}

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { validationMessage } from '@/i18n/messages';
import { DateField } from './date-field';

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  initialDate: string;
  locale: string;
  /** Lets the user remove the date (the field becomes empty). */
  optional?: boolean;
  minimumDate?: string;
  maximumDate?: string;
};

/** DateField bound to react-hook-form; empty optional dates are stored as ''. */
export function FormDateField<T extends FieldValues>({ control, name, optional = false, ...rest }: Props<T>) {
  const { t } = useTranslation();
  const { field, fieldState } = useController({ control, name });
  return (
    <DateField
      {...rest}
      value={field.value ? String(field.value) : null}
      onChange={field.onChange}
      onClear={optional ? () => field.onChange('') : undefined}
      error={validationMessage(t, fieldState.error?.message)}
    />
  );
}

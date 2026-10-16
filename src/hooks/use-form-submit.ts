import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { errorMessage } from '@/i18n/messages';

/** Runs a form's submit callback; a thrown error becomes a translated form-level message. */
export function useFormSubmit<T>(onSubmit: (values: T) => Promise<unknown>) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  async function submit(values: T) {
    setError(null);
    try {
      await onSubmit(values);
    } catch (e) {
      setError(errorMessage(t, e));
    }
  }

  return { error, submit };
}

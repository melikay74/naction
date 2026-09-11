import { useState } from 'react';
import { ApiError, submitApplication } from '../lib/api';
import type { ApplicationInput } from '../types';

const EMPTY: ApplicationInput = {
  contactName: '',
  businessName: '',
  businessType: 'tow',
  phone: '',
  email: '',
  website: '',
  serviceArea: '',
  company_website_confirm: '',
};

/**
 * Partner-application form state. The server validates
 * field by field and names the offending field in its 400 response, so
 * `errorFor` puts each message next to the input it belongs to.
 */
export function usePartnerApplication() {
  const [form, setForm] = useState<ApplicationInput>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const update =
    (key: keyof ApplicationInput) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { value } = event.target;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldError(null);

    try {
      await submitApplication(form);
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldError(err.field ?? null);
      } else {
        setError('We could not send your application. Please try again, or call us.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  /** The error message for one field, or null when it isn't the failing one. */
  const errorFor = (field: string) => (fieldError === field ? error : null);

  return { form, update, submit, submitting, submitted, error, fieldError, errorFor };
}

export type PartnerApplication = ReturnType<typeof usePartnerApplication>;

// Shared result type for form Server Actions. The string values are
// next-intl message keys, resolved to text by the client component.
export type FormState = {
  errorKey?: string;
  successKey?: string;
};

export const initialFormState: FormState = {};

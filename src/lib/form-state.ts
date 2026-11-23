export type FormState = { error?: string; ok?: string } | null;

export const fail = (error: string): FormState => ({ error });
export const done = (ok: string): FormState => ({ ok });

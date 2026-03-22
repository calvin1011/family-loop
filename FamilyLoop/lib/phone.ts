/**
 * Normalizes user-entered phone input to E.164 for Supabase `signInWithOtp` / `verifyOtp`.
 * Assumes US (+1) when the user omits a country code and passes 10 digits.
 */
export function normalizeToE164(input: string, defaultCountryCode = '1'): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (!digitsOnly) return '';

  if (hasPlus) {
    return `+${digitsOnly}`;
  }

  if (digitsOnly.length === 10) {
    return `+${defaultCountryCode}${digitsOnly}`;
  }

  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }

  return `+${digitsOnly}`;
}
